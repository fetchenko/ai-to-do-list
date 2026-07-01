import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/features/auth/repository/auth.server.repository';
import { getTaskForUser } from '@/features/tasks/repository/tasks.admin.repository';
import {
  getFailedAiLogs,
  normalizeAiError,
  parseAiRequest,
} from '@/infrastructure/ai/helpers/ai.helpers';
import {
  checkAiQuotaLimit,
  checkRequestLock,
  releaseRequestLock,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { generateSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';

export async function POST(request: Request) {
  let aiLogId: string | null = null;
  let userId;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const { user } = await getCurrentUser();
    userId = user.id;

    await checkRequestLock(user.id);
    await checkAiQuotaLimit(user.id);

    const { taskId } = await parseAiRequest(request);

    const task = await getTaskForUser(taskId, user.id);

    const result = await generateSubtasksForTask({
      task,
      userId: user.id,
      signal: controller.signal,
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
      await updateAiLog(aiLogId, getFailedAiLogs(error));
    }
    return NextResponse.json(error, { status });
  } finally {
    clearTimeout(timeout);

    releaseRequestLock(userId);
  }
}
