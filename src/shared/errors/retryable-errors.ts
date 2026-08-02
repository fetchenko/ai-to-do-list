import { ErrorCode } from '@/shared/errors/code';

const RETRYABLE_ERRORS = new Set<ErrorCode>([
  ErrorCode.AI_TIMEOUT,
  ErrorCode.AI_UNAVAILABLE,
  ErrorCode.AI_GENERATION_FAILED,
]);

export function isRetryableError(code: ErrorCode) {
  return RETRYABLE_ERRORS.has(code);
}
