import { describe, expect, it } from 'vitest';

import {
  AiGenerationTimeout,
  ValidationRequestError,
} from '@/shared/errors/app-error';
import {
  INITIAL_RETRY_DELAY_MS,
  MAX_AI_RETRIES,
  MAX_RETRY_DELAY_MS,
  retryDelay,
  shouldRetry,
} from '@/shared/react-query/ai-retry';

describe('shouldRetry', () => {
  it.each([
    {
      name: "doesn't retries unknown errors before reaching retry limit",
      failureCount: 0,
      error: new Error(),
      expected: false,
    },
    {
      name: 'retries retryable AppErrors',
      failureCount: 0,
      error: new AiGenerationTimeout('AI generation timed out'),
      expected: true,
    },
    {
      name: 'does not retry non-retryable AppErrors',
      failureCount: 0,
      error: new ValidationRequestError({}),
      expected: false,
    },
    {
      name: 'stops retrying once retry limit is reached',
      failureCount: MAX_AI_RETRIES,
      error: new AiGenerationTimeout('AI generation timed out'),
      expected: false,
    },
  ])('$name', ({ failureCount, error, expected }) => {
    expect(shouldRetry(failureCount, error)).toBe(expected);
  });
});

describe('retryDelay', () => {
  it('uses exponential backoff', () => {
    expect(retryDelay(0)).toBe(INITIAL_RETRY_DELAY_MS);
    expect(retryDelay(1)).toBe(INITIAL_RETRY_DELAY_MS * 2);
    expect(retryDelay(2)).toBe(INITIAL_RETRY_DELAY_MS * 4);
  });

  it('caps retry delay', () => {
    expect(retryDelay(3)).toBe(MAX_RETRY_DELAY_MS);
    expect(retryDelay(20)).toBe(MAX_RETRY_DELAY_MS);
  });
});
