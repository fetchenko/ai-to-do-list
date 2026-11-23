import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { parseApiError } from '@/shared/errors/utils/parse-api-error';

describe('parseApiError', () => {
  it('parses a valid API error into an AppError', () => {
    expect(
      parseApiError({
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'AI unavailable',
        details: { provider: 'deepseek' },
      })
    ).toEqual(
      new AppError(ErrorCode.AI_UNAVAILABLE, 'AI unavailable', {
        provider: 'deepseek',
      })
    );
  });

  it('parses an API error without details', () => {
    expect(
      parseApiError({
        code: ErrorCode.AI_GENERATION_TIMEOUT,
        message: 'AI request timed out',
      })
    ).toEqual(
      new AppError(ErrorCode.AI_GENERATION_TIMEOUT, 'AI request timed out')
    );
  });

  it('returns UNKNOWN for invalid API error codes', () => {
    expect(
      parseApiError({ code: 'INVALID_CODE', message: 'AI unavailable' })
    ).toEqual(new AppError(ErrorCode.UNKNOWN, 'Something went wrong.'));
  });

  it.each([
    null,
    undefined,
    'AI unavailable',
    { code: ErrorCode.AI_UNAVAILABLE },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiError(input)).toEqual(
      new AppError(ErrorCode.UNKNOWN, 'Something went wrong.')
    );
  });
});
