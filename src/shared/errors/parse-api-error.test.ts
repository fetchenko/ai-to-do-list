import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import { parseApiError } from '@/shared/errors/parse-api-error';

describe('parseApiError', () => {
  it('parses a valid API error into an AppError', () => {
    const error = parseApiError({
      code: ErrorCode.AI_UNAVAILABLE,
      status: 503,
      message: 'AI unavailable',
      details: { provider: 'deepseek' },
    });

    expect(error).toEqual(
      new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'AI unavailable', {
        provider: 'deepseek',
      })
    );
  });

  it('parses an API error without details', () => {
    const error = parseApiError({
      code: ErrorCode.AI_GENERATION_TIMEOUT,
      status: 504,
      message: 'AI request timed out',
    });

    expect(error).toEqual(
      new AppError(ErrorCode.AI_GENERATION_TIMEOUT, 504, 'AI request timed out')
    );
  });

  it('returns an UNKNOWN AppError for an invalid API error', () => {
    const error = parseApiError({
      code: 'INVALID_CODE',
      status: 503,
      message: 'AI unavailable',
    });

    expect(error).toEqual(
      new AppError(
        ErrorCode.UNKNOWN,
        ErrorHttpStatus[ErrorCode.UNKNOWN],
        'Something went wrong.'
      )
    );
  });

  it.each([
    null,
    undefined,
    'AI unavailable',
    { code: ErrorCode.AI_UNAVAILABLE },
    {
      code: ErrorCode.AI_UNAVAILABLE,
      status: '503',
      message: 'AI unavailable',
    },
  ])('returns an UNKNOWN AppError for invalid input: %s', (input) => {
    expect(parseApiError(input)).toEqual(
      new AppError(
        ErrorCode.UNKNOWN,
        ErrorHttpStatus[ErrorCode.UNKNOWN],
        'Something went wrong.'
      )
    );
  });
});
