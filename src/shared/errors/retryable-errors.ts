import { ErrorCode } from '@/shared/errors/code';

export const RETRYABLE_ERRORS = new Set<ErrorCode>([
  ErrorCode.AI_TIMEOUT,
  ErrorCode.AI_UNAVAILABLE,
  ErrorCode.AI_GENERATION_FAILED,
]);
