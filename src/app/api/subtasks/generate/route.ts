import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateSubtasksForTask } from "@/lib/ai/ai-service";
import { parseAiRequest, handleAiError } from "@/lib/ai/ai.helpers";

// todo: block other calls when one call is running
export async function POST(request: Request) {
  let aiLogId: string | null = null;

  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const req = await parseAiRequest(request);
    const { user } = await getCurrentUser();

    const result = await generateSubtasksForTask({
      taskId: req.taskId,
      userId: user.id,
      signal: controller.signal,
    });

    const { parsedData } = result;
    aiLogId = result.aiLogId;

    return NextResponse.json({
      success: true,
      status: 200,
      data: { subtasks: parsedData.subtasks },
    });
  } catch (err: unknown) {
    const error = handleAiError(err, aiLogId);

    return NextResponse.json(error);
  } finally {
    clearTimeout(timeout);
  }
}
