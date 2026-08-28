import { AiErrorResult } from '@/infrastructure/ai/types/ai.types';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function normalizeAiError(err: unknown): AiErrorResult {
  if (err instanceof Error && err.name === 'AbortError') {
    return {
      success: false,
      code: ErrorCode.AI_TIMEOUT,
      message: 'AI request timed out',
      status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT],
    };
  }

  if (err instanceof AppError) {
    return {
      success: false,
      status: err.status ?? ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      code: err.code ?? ErrorCode.AI_GENERATION_FAILED,
      message: err.message ?? 'AI generation failed',
      details: err.details,
    };
  }

  return {
    success: false,
    status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
    code: ErrorCode.AI_GENERATION_FAILED,
    message: err instanceof Error ? err.message : 'AI generation failed',
  };
}

export function getErrorDetails(error: unknown) {
  if (error instanceof TypeError) {
    return {
      message: error.message,
    };
  }

  return undefined;
}
