import { ApiError } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';

const DEFAULT_AI_ERROR_MESSAGE = 'AI generation failed';

export function normalizeApiError(err: unknown): ApiError {
  if (isAbortError(err)) {
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
    };
  }

  return {
    success: false,
    code: ErrorCode.AI_GENERATION_FAILED,
    message: DEFAULT_AI_ERROR_MESSAGE,
  };
}
