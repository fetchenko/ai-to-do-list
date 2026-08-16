import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import {
  checkAiQuotaLimit,
  checkRequestLock,
  releaseRequestLock,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import {
  generateSubtasksStream,
  SubtaskGenerationEvent,
} from '@/infrastructure/ai/services/subtasks.service';
import { AiSubtaskStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';

const encoder = new TextEncoder();
const STREAM_TIMEOUT_MS = 60_000;

function encodeEvent(event: AiSubtaskStreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function encodeGenerationEvent(event: SubtaskGenerationEvent): Uint8Array {
  return encodeEvent(event);
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  let userId: string | undefined;
  let streamStarted = false;

  try {
    const { user } = await getCurrentUser();
    userId = user.id;

    await checkRequestLock(user.id);
    await checkAiQuotaLimit(user.id);

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);
    const controller = new AbortController();

    streamStarted = true;

    const stream = new ReadableStream<Uint8Array>({
      async start(streamController) {
        let timedOut = false;
        const timeout = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, STREAM_TIMEOUT_MS);

        try {
          for await (const event of generateSubtasksStream({
            task,
            userId: user.id,
            signal: controller.signal,
          })) {
            streamController.enqueue(encodeGenerationEvent(event));
          }
        } catch (error) {
          if (controller.signal.aborted && !timedOut) {
            return;
          }

          const normalized = normalizeAiError(error);

          try {
            streamController.enqueue(
              encodeEvent({
                type: 'error',
                error: {
                  code: timedOut ? normalized.code : normalized.code,
                  message:
                    normalized.error ?? 'Failed to generate subtasks',
                  status: normalized.status,
                },
              })
            );
          } catch {
            // The client disconnected before the error could be delivered.
          }
        } finally {
          clearTimeout(timeout);

          try {
            await releaseRequestLock(user.id);
          } finally {
            streamController.close();
          }
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
        'Content-Encoding': 'identity',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const { status, ...normalized } = normalizeAiError(error);

    return NextResponse.json(
      { error: normalized },
      { status }
    );
  } finally {
    if (!streamStarted) {
      await releaseRequestLock(userId);
    }
  }
}
