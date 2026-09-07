import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

const RETRYABLE_ERRORS = new Set<ErrorCode>([
  ErrorCode.AI_GENERATION_TIMEOUT,
  ErrorCode.AI_UNAVAILABLE,
  ErrorCode.AI_GENERATION_FAILED,
]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return RETRYABLE_ERRORS.has(error.code);
  }

  return false;
}
