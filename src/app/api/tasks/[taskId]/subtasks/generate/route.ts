import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { failAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { generateSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';

const AI_TIMEOUT_MS = 60_000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
  let aiLogId: string | null = null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const { user } = await getCurrentUser();

    const provider = getAIProvider();

    if (provider.quotaLimit !== undefined) {
      await checkAiQuotaLimit(user.id, provider.quotaLimit);
    }

    const { taskId } = await parseAiParams(params);
    const task = await getTaskForUser(taskId, user.id);

    const result = await generateSubtasksForTask({
      task,
      userId: user.id,
      signal: controller.signal,
      provider,
    });

    aiLogId = result.aiLogId;

    return NextResponse.json(
      {
        success: true,
        data: { subtasks: result.data.subtasks },
      },
      {
        status: 200,
      }
    );
  } catch (err: unknown) {
    const { status, ...error } = normalizeAiError(err);

    if (aiLogId) {
      await failAiGenerationLog({ id: aiLogId, errorCode: error.code });
    }
    return NextResponse.json({ error }, { status });
  } finally {
    clearTimeout(timeout);
  }
}
