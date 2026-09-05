import { ApiError } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

const DEFAULT_AI_ERROR_MESSAGE = 'AI generation failed';

export function normalizeApiError(err: unknown): ApiError {
  if (err instanceof Error && err.name === 'AbortError') {
    return {
      success: false,
      code: ErrorCode.AI_GENERATION_TIMEOUT,
      message: 'AI request timed out',
    };
  }

  if (err instanceof AppError) {
    return {
      success: false,
      code: err.code ?? ErrorCode.AI_GENERATION_FAILED,
      message: err.message ?? DEFAULT_AI_ERROR_MESSAGE,
      details: err.details,
    };
  }

  return {
    success: false,
    code: ErrorCode.AI_GENERATION_FAILED,
    message: DEFAULT_AI_ERROR_MESSAGE,
  };
}
