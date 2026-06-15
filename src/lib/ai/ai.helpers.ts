import {
  AiGenerationError,
  AiRateLimitsError,
  ResponseFormatError,
  ValidationRequestError,
} from "@/shared/errors/app-error";
import { requestGenSubtasksSchema } from "../validation/request";
import { ErrorCode } from "@/shared/errors/code";
import { ErrorHttpStatus } from "@/shared/errors/http-status-map";
import { updateAiLog } from "./logs/update-log";
import { subtasksSchema } from "../validation/task";

export async function parseAiRequest(request: Request): Promise<any> {
  const { data, success: parsed } = requestGenSubtasksSchema.safeParse(
    await request.json(),
  );

  if (!parsed) {
    throw new ValidationRequestError(
      "Invalid request payload, taskId is required",
    );
  }

  return data;
}

export async function handleAiError(err: unknown, aiLogId: string | null) {
  const message = err instanceof Error ? err.message : "Unknown error";

  const error =
    err instanceof Error && err.name === "AbortError"
      ? {
          success: false,
          code: ErrorCode.AI_TIMEOUT,
          message: "AI request timed out",
          status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT],
        }
      : {
          success: false,
          status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
          code: ErrorCode.AI_GENERATION_FAILED,
          error: `Failed to generate subtasks: ${message} `,
        };

  if (aiLogId) {
    await updateAiLog(aiLogId, {
      status: "failed",
      error_code: error.code,
      finished_at: new Date().toISOString(),
    });
  }

  return error;
}

export async function handleAiResponse(response: Response) {
  if (!response.ok) {
    if (response.status === ErrorHttpStatus[ErrorCode.AI_RATE_LIMIT]) {
      throw new AiRateLimitsError(JSON.stringify(response));
    }

    throw new AiGenerationError(JSON.stringify(response));
  }

  const raw = await response.json();
  let parsedData;

  try {
    parsedData = JSON.parse(raw.response);
  } catch (error) {
    throw new ResponseFormatError({ error });
  }

  const validatedData = subtasksSchema.safeParse(parsedData);

  if (!validatedData.success) {
    throw new ResponseFormatError("Invalid format of AI response");
  }

  return {
    raw,
    parsedData: parsedData,
  };
}
