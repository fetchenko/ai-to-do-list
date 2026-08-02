import { describe, expect, it } from 'vitest';

import {
  AiTimeoutError,
  AppError,
  ValidationRequestError,
} from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import {
  MAX_AI_RETRIES,
  retryDelay,
  shouldRetry,
} from '@/shared/react-query/ai-retry';

describe('shouldRetry', () => {
  it('retries retryable AppErrors', () => {
    const error = new AppError(
      ErrorCode.AI_UNAVAILABLE,
      ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
      'Temporary failure',
      undefined,
      true
    );

    expect(shouldRetry(0, error)).toBe(true);
  });

  it('stops retrying retryable AppErrors after the retry limit', () => {
    const error = new AppError(
      ErrorCode.AI_UNAVAILABLE,
      ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
      'Temporary failure',
      undefined,
      true
    );

    expect(shouldRetry(MAX_AI_RETRIES, error)).toBe(false);
  });

  it('does not retry non-retryable AppErrors', () => {
    const error = new AppError(
      ErrorCode.INVALID_REQUEST,
      ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
      'Invalid request',
      undefined,
      false
    );

    expect(shouldRetry(0, error)).toBe(false);
  });

  it.each([
    {
      name: 'unknown error on first attempt',
      failureCount: 0,
      error: new Error(),
      expected: true,
    },
    {
      name: 'unknown error on second attempt',
      failureCount: 1,
      error: new Error(),
      expected: true,
    },
    {
      name: 'unknown error at retry limit',
      failureCount: MAX_AI_RETRIES,
      error: new Error(),
      expected: false,
    },
    {
      name: 'retryable AppError',
      failureCount: 0,
      error: new AppError(
        ErrorCode.AI_UNAVAILABLE,
        ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
        '',
        undefined,
        true
      ),
      expected: true,
    },
    {
      name: 'non-retryable AppError',
      failureCount: 0,
      error: new AppError(
        ErrorCode.INVALID_REQUEST,
        ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
        '',
        undefined,
        false
      ),
      expected: false,
    },
    {
      name: 'retryable AppError at retry limit',
      failureCount: MAX_AI_RETRIES,
      error: new AppError(
        ErrorCode.AI_UNAVAILABLE,
        ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
        '',
        undefined,
        true
      ),
      expected: false,
    },
  ])('$name', ({ failureCount, error, expected }) => {
    expect(shouldRetry(failureCount, error)).toBe(expected);
  });

  it('does not retry AppErrors with an undefined retryable flag', () => {
    const error = new AppError(
      ErrorCode.UNKNOWN,
      ErrorHttpStatus[ErrorCode.UNKNOWN],
      'Unknown failure'
    );

    expect(shouldRetry(0, error)).toBe(false);
  });
});

describe('retryDelay', () => {
  it('uses exponential backoff', () => {
    expect(retryDelay(0)).toBe(1000);
    expect(retryDelay(1)).toBe(2000);
    expect(retryDelay(2)).toBe(4000);
  });

  it('caps delay', () => {
    expect(retryDelay(3)).toBe(5000);
    expect(retryDelay(20)).toBe(5000);
  });
});

describe('retryable error mapping', () => {
  it('marks AI timeout as retryable', () => {
    expect(new AiTimeoutError().retryable).toBe(true);
  });

  it('marks validation errors as non-retryable', () => {
    expect(new ValidationRequestError({}).retryable).toBe(false);
  });
});
