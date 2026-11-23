import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiEventError } from '@/client/errors/parse-api-event-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiEventError', () => {
  it('maps a valid event error without exposing API details', () => {
    expect(
      parseApiEventError({
        success: false,
        code: ErrorCode.AI_UNAVAILABLE,
        status: 503,
        message: 'AI unavailable',
        details: { provider: 'deepseek' },
      })
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });

  it('returns UNKNOWN for invalid event errors', () => {
    expect(
      parseApiEventError({
        success: false,
        code: 'INVALID_CODE',
        status: 503,
        message: 'AI unavailable',
      })
    ).toEqual(new ClientError(ErrorCode.UNKNOWN));
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
