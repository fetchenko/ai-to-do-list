import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import { parseApiError } from '@/shared/errors/parse-api-error';

describe('parseApiError', () => {
  it('parses a valid API error into an AppError', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: 503,
          message: 'AI unavailable',
          details: { provider: 'deepseek' },
        },
        503
      )
    ).toEqual(
      new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'AI unavailable', {
        provider: 'deepseek',
      })
    );
  });

  it('uses the HTTP response status instead of the status in the error body', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: 500,
          message: 'AI unavailable',
        },
        503
      )
    ).toEqual(new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'AI unavailable'));
  });

  it('parses an API error without details', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_GENERATION_TIMEOUT,
          status: 504,
          message: 'AI request timed out',
        },
        504
      )
    ).toEqual(
      new AppError(ErrorCode.AI_GENERATION_TIMEOUT, 504, 'AI request timed out')
    );
  });

  it('returns UNKNOWN for invalid API error codes', () => {
    expect(
      parseApiError(
        { code: 'INVALID_CODE', status: 503, message: 'AI unavailable' },
        503
      )
    ).toEqual(
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
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiError(input, 503)).toEqual(
      new AppError(
        ErrorCode.UNKNOWN,
        ErrorHttpStatus[ErrorCode.UNKNOWN],
        'Something went wrong.'
      )
    );
  });

  it('accepts a valid error body even when its status is represented as a string', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: '503',
          message: 'AI unavailable',
        },
        503
      )
    ).toEqual(new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'AI unavailable'));
  });
});
