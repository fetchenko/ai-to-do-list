import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { checkRequestLock, releaseRequestLock } from '@/infrastructure/ai/services/ai-lock.admin.service';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';

const AI_STREAM_TIMEOUT_MS = 600_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  let lockAcquired = false;
  let userId: string | undefined;

  try {
    const { user } = await getCurrentUser();
    userId = user.id;

    await checkRequestLock(user.id);
    lockAcquired = true;

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

    const result = await streamSubtasksForTask({
      task,
      userId: user.id,
      provider,
      signal,
    });

    // The stream owns the lock from this point onward.
    lockAcquired = false;

    return new Response(result.stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err: unknown) {
    if (lockAcquired && userId) {
      await releaseRequestLock(userId);
    }

    const { status, ...error } = normalizeAiError(err);

    return NextResponse.json({ error }, { status });
  }
}
