import {
  AiLockActiveError,
  AiLockRequestFailedError,
  AiRequestLimitError,
  AppError,
  ResponseFormatError,
  ValidationRequestError,
} from "@/shared/errors/app-error";
import { requestGenSubtasksSchema } from "../validation/request";
import { ErrorCode } from "@/shared/errors/code";
import { ErrorHttpStatus } from "@/shared/errors/http-status-map";
import { createClient } from "../supabase/server";
import { AiLogs } from "./ai.types";

const MAX_AI_REQUESTS_PER_USER = 10;

export async function parseAiRequest(request: Request) {
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

export async function normalizeAiError(err: AppError) {
  const error =
    err instanceof Error && err.name === "AbortError"
      ? {
          success: false,
          code: ErrorCode.AI_TIMEOUT,
          error: "AI request timed out",
          status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT],
        }
      : {
          success: false,
          status: err.status || ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
          code: err.code || ErrorCode.AI_GENERATION_FAILED,
          error: err.details || `Failed to generate subtasks: ${err.message} `,
        };

  return error;
}

export async function parseResponseJson(response: Response) {
  let raw;
  try {
    raw = await response.json();
  } catch (error) {
    throw new ResponseFormatError({ error });
  }

  return raw;
}

export async function checkRequestLock(userId: string) {
  const supabase = await createClient();

  const { data: lockAcquired, error } = await supabase.rpc(
    "try_acquire_user_ai_lock",
    { user_id: userId },
  );

  if (error) {
    throw new AiLockRequestFailedError(error);
  }

  if (!lockAcquired) {
    throw new AiLockActiveError(
      "Another AI generation is already running for this user",
    );
  }
}

export async function checkAiQuotaLimit(userId: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("ai_generations")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("feature", "generate-subtasks")
    .eq("status", "success");

  if ((count ?? 0) >= MAX_AI_REQUESTS_PER_USER) {
    throw new AiRequestLimitError(
      `Reached maximum AI requests per user (${MAX_AI_REQUESTS_PER_USER}`,
    );
  }
}

export function getInitialAiLog(userId: string, taskId: string) {
  return {
    task_id: taskId,
    user_id: userId,
    feature: "generate-subtasks",
    status: "pending",
    started_at: new Date().toISOString(),
  };
}

export function getSuccessAiLogs(aiLogUpdates: AiLogs, raw: any) {
  return {
    ...aiLogUpdates,
    response: raw,
    status: "success",
    finished_at: new Date().toISOString(),
  };
}

export function getFailedAiLogs(error: AppError) {
  return {
    status: "failed",
    error_code: error.code,
    finished_at: new Date().toISOString(),
  };
}
