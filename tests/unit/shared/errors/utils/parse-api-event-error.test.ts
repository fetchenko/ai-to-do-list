import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';
import { parseApiEventError } from '@/shared/errors/utils/parse-api-event-error';

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
      new ClientError(ErrorCode.AI_UNAVAILABLE, 503)
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
      new ClientError(ErrorCode.UNKNOWN)
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
      new ClientError(ErrorCode.UNKNOWN)
    );
  });
});
