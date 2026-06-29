import { AiErrorResult, AiLogs } from '@/infrastructure/ai/types/ai.types';
import { requestGenSubtasksSchema } from '@/infrastructure/ai/validation/ai.request';
import { AppError, ResponseFormatError, ValidationRequestError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function parseAiRequest(request: Request) {
  const { data, success: parsed } = requestGenSubtasksSchema.safeParse(await request.json());

  if (!parsed) {
    throw new ValidationRequestError('Invalid request payload, taskId is required');
  }

  return data;
}

export function normalizeAiError(err: unknown): AiErrorResult {
  if (err instanceof Error && err.name === 'AbortError') {
    return {
      success: false,
      code: ErrorCode.AI_TIMEOUT,
      error: 'AI request timed out',
      status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT],
    };
  }

  if (err instanceof AppError) {
    return {
      success: false,
      status: err.status ?? ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      code: err.code ?? ErrorCode.AI_GENERATION_FAILED,
    };
  }

  return {
    success: false,
    status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
    code: ErrorCode.AI_GENERATION_FAILED,
  };
}

export async function parseResponseJson(response: Response): Promise<string> {
  let raw;
  try {
    raw = await response.json();
  } catch (error) {
    throw new ResponseFormatError({ error });
  }

  return raw;
}

export function getInitialAiLog(userId: string, taskId: string) {
  return {
    task_id: taskId,
    user_id: userId,
    feature: 'generate-subtasks',
    status: 'pending',
    started_at: new Date().toISOString(),
  };
}

export function getSuccessAiLogs(aiLogUpdates: AiLogs, raw: string) {
  return {
    ...aiLogUpdates,
    response: raw,
    status: 'success',
    finished_at: new Date().toISOString(),
  };
}

export function getFailedAiLogs(error: Omit<AiErrorResult, 'status'>) {
  return {
    status: 'failed',
    finished_at: new Date().toISOString(),
    error_code: error.code,
  };
}
