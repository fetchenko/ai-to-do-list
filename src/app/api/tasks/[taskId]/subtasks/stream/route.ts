import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import {
  checkRequestLock,
  releaseRequestLock,
} from '@/infrastructure/ai/services/ai-lock.admin.service';
import { updateAiLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { getFailedAiLogs } from '@/infrastructure/ai/utils/ai-log.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';

export async function POST(
  _request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  let aiLogId: string | null = null;
  let userId;

  try {
    const { user } = await getCurrentUser();
    userId = user.id;

    await checkRequestLock(user.id);

    const provider = getAIProvider();

    if (provider.quotaLimit !== undefined) {
      await checkAiQuotaLimit(user.id, provider.quotaLimit);
    }

    const { taskId } = await parseAiParams(params);

    const task = await getTaskForUser(taskId, user.id);

    const result = await streamSubtasksForTask({
      task,
      userId: user.id,
      provider,
    });

    aiLogId = result.aiLogId;

    return new Response(result.stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: unknown) {
    const { status, ...error } = normalizeAiError(err);

    if (aiLogId) {
      await updateAiLog(aiLogId, getFailedAiLogs(error));
    }
    return NextResponse.json({ error }, { status });
  } finally {
    await releaseRequestLock(userId);
  }
}
