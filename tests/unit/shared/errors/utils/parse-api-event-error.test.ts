import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';
import { parseApiEventError } from '@/client/errors/parse-api-event-error';

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
      new ClientError(ErrorCode.AI_UNAVAILABLE, 'AI unavailable', {
        status: 503,
        cause: {
        provider: 'deepseek',
      })
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
      new ClientError(ErrorCode.UNKNOWN, 'Something went wrong.')
    );
  });

  it.each([
    null,
    undefined,
    {},
    { success: false, code: ErrorCode.AI_UNAVAILABLE },
    {
      success: false,
      code: ErrorCode.AI_UNAVAILABLE,
      status: '503',
      message: 'x',
    },
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
