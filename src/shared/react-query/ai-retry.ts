import { AppError } from '@/shared/errors/app-error';

export const MAX_AI_RETRIES = 2;
export const MAX_RETRY_DELAY = 5000;
export const INITIAL_DELAY = 1000;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_AI_RETRIES) {
    return false;
  }

  if (!(error instanceof AppError)) {
    return true;
  }

  return error.retryable === true;
}

export function getRetryDelay(attempt: number): number {
  return Math.min(INITIAL_DELAY * 2 ** attempt, MAX_RETRY_DELAY);
}
