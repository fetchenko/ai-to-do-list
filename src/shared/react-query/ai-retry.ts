import { AppError } from '@/shared/errors/app-error';
import { isRetryableError } from '@/shared/errors/utils/retryable-errors';

export const MAX_AI_RETRIES = 2;
export const MAX_RETRY_DELAY_MS = 5000;
export const INITIAL_RETRY_DELAY_MS = 1000;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_AI_RETRIES) {
    return false;
  }

  if (!(error instanceof AppError)) {
    return false;
  }

  return isRetryableError(error);
}

export function retryDelay(attempt: number): number {
  return Math.min(INITIAL_RETRY_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
}
