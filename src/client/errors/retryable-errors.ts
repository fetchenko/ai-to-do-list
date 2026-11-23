import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

const RETRYABLE_ERRORS = new Set<ErrorCode>([
  ErrorCode.AI_GENERATION_TIMEOUT,
  ErrorCode.AI_UNAVAILABLE,
  ErrorCode.AI_GENERATION_FAILED,
]);

export function isRetryableError(error: unknown): boolean {
  return error instanceof ClientError && RETRYABLE_ERRORS.has(error.code);
}
