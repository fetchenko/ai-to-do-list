import { AiErrorResult } from '@/infrastructure/ai/types/ai.types';
import { apiErrorSchema } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function parseApiError(error: unknown): AppError {
  const result = apiErrorSchema.safeParse(error);

  if (!result.success) {
    return new AppError(
      ErrorCode.UNKNOWN,
      ErrorHttpStatus[ErrorCode.UNKNOWN],
      'Something went wrong.'
    );
  }

  const { code, status, message, details } = result.data;

  return new AppError(code, status, message, details);
}

export function normalizeAiError(err: unknown): AiErrorResult {
  if (err instanceof Error && err.name === 'AbortError') {
    return {
      success: false,
      code: ErrorCode.AI_TIMEOUT,
      message: 'AI request timed out',
      status: ErrorHttpStatus[ErrorCode.AI_TIMEOUT],
    };
  }

  if (err instanceof TypeError) {
    return {
      success: false,
      status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      code: ErrorCode.AI_GENERATION_FAILED,
      message: err.message ?? 'AI generation failed',
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
