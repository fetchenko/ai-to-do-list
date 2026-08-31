import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { SubtaskStreamEvent } from '@/features/tasks/types/stream-event.types';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';
import { toNdjsonStream } from '@/shared/streams/to-ndjson-stream';

const AI_STREAM_TIMEOUT_MS = 600_000;

function toClientEvent(event: AiStreamEvent): SubtaskStreamEvent {
  if (event.type === 'done') {
    return { type: 'done' };
  }

  return event;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  try {
    const { user } = await getCurrentUser();
    const provider = getAIProvider();

    if (provider.quotaLimit !== undefined) {
      await checkAiQuotaLimit(user.id, provider.quotaLimit);
    }

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);

    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(AI_STREAM_TIMEOUT_MS),
    ]);

    const events = streamSubtasksForTask({
      task,
      userId: user.id,
      provider,
      signal,
    });

    return new Response(toNdjsonStream(events, toClientEvent), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err: unknown) {
    const { status, ...error } = normalizeAiError(err);

    return NextResponse.json({ error }, { status });
  }
}
