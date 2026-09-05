import { describe, expect, it } from 'vitest';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import { parseApiEventError } from '@/shared/errors/parse-api-event-error';

describe('parseApiEventError', () => {
  it('parses a valid event error and preserves details', () => {
    expect(
      parseApiEventError({
        success: false,
        code: ErrorCode.AI_UNAVAILABLE,
        status: 503,
        message: 'AI unavailable',
        details: { provider: 'deepseek' },
      })
    ).toEqual(
      new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'AI unavailable', {
        provider: 'deepseek',
      })
    );
  });

  it('returns UNKNOWN for invalid event errors', () => {
    expect(
      parseApiEventError({
        success: false,
        code: 'INVALID_CODE',
        status: 503,
        message: 'AI unavailable',
      })
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
    {},
    { success: false, code: ErrorCode.AI_UNAVAILABLE },
    { success: false, code: ErrorCode.AI_UNAVAILABLE, status: '503', message: 'x' },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiEventError(input)).toEqual(
      new AppError(
        ErrorCode.UNKNOWN,
        ErrorHttpStatus[ErrorCode.UNKNOWN],
        'Something went wrong.'
      )
    );
  });
});
