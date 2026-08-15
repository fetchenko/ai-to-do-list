import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import {
  checkAiQuotaLimit,
  checkRequestLock,
  releaseRequestLock,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { prepareSubtasksStream } from '@/infrastructure/ai/services/subtasks.service';
import { AiSubtaskStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { getFailedAiLogs, getSuccessAiLogs } from '@/infrastructure/ai/utils/ai-log.utils';
import { SubtaskStreamParser } from '@/infrastructure/ai/utils/subtask-stream.parser';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

const encoder = new TextEncoder();

function encodeEvent(event: AiSubtaskStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  let userId: string | undefined;
  let aiLogId: string | null = null;
  let streamStarted = false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const { user } = await getCurrentUser();
    userId = user.id;

    await checkRequestLock(user.id);
    await checkAiQuotaLimit(user.id);

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);

    const result = await prepareSubtasksStream({
      task,
      userId: user.id,
      signal: controller.signal,
    });

    aiLogId = result.aiLogId;
    streamStarted = true;

    const stream = new ReadableStream<Uint8Array>({
      async start(streamController) {
        const parser = new SubtaskStreamParser();
        let emittedSubtasks = 0;

        try {
          for await (const event of result.stream) {
            if (event.type === 'content') {
              const subtasks = parser.push(event.content);

              for (const subtask of subtasks) {
                emittedSubtasks += 1;
                streamController.enqueue(
                  encodeEvent({ type: 'subtask', subtask })
                );
              }

              continue;
            }

            if (event.type === 'complete') {
              if (!event.response.data.subtasks.length || !emittedSubtasks) {
                throw new AppError(
                  ErrorCode.AI_EMPTY_RESPONSE,
                  ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
                  'No meaningful subtasks could be generated.'
                );
              }

              if (aiLogId) {
                await updateAiLog(
                  aiLogId,
                  getSuccessAiLogs(
                    event.response.aiLogs,
                    event.response.raw
                  )
                );
              }

              streamController.enqueue(encodeEvent({ type: 'done' }));
            }
          }
        } catch (err: unknown) {
          const { status, ...error } = normalizeAiError(err);

          if (aiLogId) {
            await updateAiLog(aiLogId, getFailedAiLogs(error));
          }

          if (!controller.signal.aborted) {
            streamController.enqueue(
              encodeEvent({
                type: 'error',
                error: {
                  code: error.code,
                  message: error.message,
                  status,
                  details: error.details,
                },
              })
            );
          }
        } finally {
          clearTimeout(timeout);
          await releaseRequestLock(userId);
          streamController.close();
        }
      },
      cancel() {
        controller.abort();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err: unknown) {
    clearTimeout(timeout);

    const { status, ...error } = normalizeAiError(err);

    if (aiLogId) {
      await updateAiLog(aiLogId, getFailedAiLogs(error));
    }

    return NextResponse.json({ error }, { status });
  } finally {
    if (!streamStarted) {
      await releaseRequestLock(userId);
    }
  }
}
