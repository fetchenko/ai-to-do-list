import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSubtasksForTask } from "@/lib/ai/ai-service";
import {
  parseAiRequest,
  normalizeAiError,
  checkRequestLock,
  checkAiQuotaLimit,
  getFailedAiLogs,
} from "@/lib/ai/ai.helpers";
import { updateAiLog } from "@/lib/ai/logs/update-log";

export async function POST(request: Request) {
  let aiLogId: string | null = null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const req = await parseAiRequest(request);
    const { user } = await getCurrentUser();

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
