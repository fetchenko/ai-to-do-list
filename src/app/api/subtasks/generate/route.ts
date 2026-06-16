import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSubtasksForTask } from "@/lib/ai/ai-service";
import {
  parseAiRequest,
  handleAiError,
  checkRequestLock,
  checkAiQuotaLimit,
} from "@/lib/ai/ai.helpers";

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

    const { parsedData } = result;
    aiLogId = result.aiLogId;

    return NextResponse.json(
      {
        success: true,
        data: { subtasks: parsedData.subtasks },
      },
      {
        status: 200,
      },
    );
  } catch (err: any) {
    const { status, ...error } = await handleAiError(err, aiLogId);

    return NextResponse.json(error, { status });
  } finally {
    clearTimeout(timeout);
  }
}
