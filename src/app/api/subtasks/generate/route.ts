import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/repository/auth.server.repository";
import { generateSubtasksForTask } from "@/infrastructure/ai/services/subtasks.service";
import {
  parseAiRequest,
  normalizeAiError,
  checkRequestLock,
  checkAiQuotaLimit,
  getFailedAiLogs,
} from "@/infrastructure/ai/helpers/ai.helpers";
import { updateAiLog } from "@/infrastructure/ai/ai-logs/update-ai-log";

export async function POST(request: Request) {
  let aiLogId: string | null = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const { user } = await getCurrentUser();

    const req = await parseAiRequest(request);

    await checkRequestLock(user.id);
    await checkAiQuotaLimit(user.id);

    const result = await generateSubtasksForTask({
      taskId: req.taskId,
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
      },
    );
  } catch (err: unknown) {
    const { status, ...error } = normalizeAiError(err);

    if (aiLogId) {
      await updateAiLog(aiLogId, getFailedAiLogs(error));
    }
    return NextResponse.json(error, { status });
  } finally {
    clearTimeout(timeout);
  }
}
