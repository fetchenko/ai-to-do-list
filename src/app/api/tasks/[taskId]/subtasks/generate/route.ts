import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { RequestGenSubtasks } from '@/infrastructure/ai/schema/ai-request';
import { checkAiQuotaLimit } from '@/infrastructure/ai/services/ai-quota-limit.admin.service';
import { generateSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { parseAiParams } from '@/infrastructure/ai/utils/ai-params.utils';
import { normalizeAiError } from '@/infrastructure/ai/utils/normalize-ai-error';

const AI_TIMEOUT_MS = 60_000;

export async function POST(
  _request: Request,
  { params }: { params: Promise<RequestGenSubtasks> }
) {
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

    return NextResponse.json({ error }, { status });
  } finally {
    clearTimeout(timeout);
  }
}
