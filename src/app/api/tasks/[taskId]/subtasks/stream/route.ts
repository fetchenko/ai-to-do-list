import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';
import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { getHttpStatusCode } from '@/shared/errors/get-http-status-code';

const AI_STREAM_TIMEOUT_MS = 600_000;

export async function POST(
  request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  const signal = AbortSignal.any([
    request.signal,
    AbortSignal.timeout(AI_STREAM_TIMEOUT_MS),
  ]);

  try {
    const { user } = await getCurrentUser();
    const provider = getAIProvider();

    if (provider.quotaLimit !== undefined) {
      await checkAiQuotaLimit(user.id, provider.quotaLimit);
    }

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);

    const stream = await streamSubtasksForTask({
      task,
      userId: user.id,
      provider,
      signal,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err: unknown) {
    const error = normalizeApiError(err);
    const status = getHttpStatusCode(error.code);

    return NextResponse.json({ error }, { status });
  }
}
