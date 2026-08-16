import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { checkAiQuotaLimit, checkRequestLock, releaseRequestLock, updateAiLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { prepareSubtasksStream } from '@/infrastructure/ai/services/subtasks.service';
import { AiSubtaskStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { getFailedAiLogs, getSuccessAiLogs } from '@/infrastructure/ai/utils/ai-log.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';
import { SubtaskStreamParser } from '@/infrastructure/ai/utils/subtask-stream.parser';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

const encoder = new TextEncoder();
const STREAM_TIMEOUT_MS = 60_000;

function encodeEvent(event: AiSubtaskStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(_request: Request, { params }: { params: Promise<RequestGenSubtasks> }) {
  let userId: string | undefined;
  let aiLogId: string | null = null;
  let streamStarted = false;
  let timedOut = false;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, STREAM_TIMEOUT_MS);

  try {
    const { user } = await getCurrentUser();
    userId = user.id;
    await checkRequestLock(user.id);
    await checkAiQuotaLimit(user.id);

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);
    const result = await prepareSubtasksStream({ task, userId: user.id, signal: controller.signal });
    aiLogId = result.aiLogId;
    streamStarted = true;

    const stream = new ReadableStream<Uint8Array>({
      async start(streamController) {
        const parser = new SubtaskStreamParser();
        let emittedSubtasks = 0;
        let completed = false;
        let cancelled = false;

        try {
          for await (const event of result.stream) {
            if (event.type === 'content') {
              if (completed) {
                throw new AppError(ErrorCode.AI_INVALID_RESPONSE_FORMAT, ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT], 'AI stream contained content after completion');
              }
              for (const subtask of parser.push(event.content)) {
                emittedSubtasks += 1;
                streamController.enqueue(encodeEvent({ type: 'subtask', subtask }));
              }
              continue;
            }

            if (completed) {
              throw new AppError(ErrorCode.AI_INVALID_RESPONSE_FORMAT, ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT], 'AI stream contained duplicate completion events');
            }

            parser.finish();
            completed = true;
            if (!event.response.data.subtasks.length || !emittedSubtasks) {
              throw new AppError(ErrorCode.AI_EMPTY_RESPONSE, ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE], 'No meaningful subtasks could be generated.');
            }

            if (aiLogId) {
              await updateAiLog(aiLogId, getSuccessAiLogs(event.response.aiLogs, event.response.raw));
            }
            streamController.enqueue(encodeEvent({ type: 'done' }));
          }
        } catch (err: unknown) {
          const { status, ...error } = normalizeAiError(err);
          if (aiLogId) await updateAiLog(aiLogId, getFailedAiLogs(error));

          if (timedOut && !cancelled) {
            streamController.enqueue(encodeEvent({
              type: 'error',
              error: { code: ErrorCode.AI_TIMEOUT, message: 'AI request timed out', status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT] },
            }));
          } else if (!controller.signal.aborted && !cancelled) {
            streamController.enqueue(encodeEvent({
              type: 'error',
              error: { code: error.code, message: error.error ?? 'Failed to generate subtasks', status },
            }));
          }
        } finally {
          clearTimeout(timeout);
          try {
            await releaseRequestLock(userId);
          } finally {
            streamController.close();
          }
        }

        // Keep this local state available to the stream cancellation callback.
        return () => {
          cancelled = true;
        };
      },
      cancel() {
        if (!timedOut) controller.abort();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Content-Encoding': 'identity',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    const { status, ...error } = normalizeAiError(err);
    if (aiLogId) await updateAiLog(aiLogId, getFailedAiLogs(error));
    return NextResponse.json({ error }, { status });
  } finally {
    if (!streamStarted) await releaseRequestLock(userId);
  }
}
