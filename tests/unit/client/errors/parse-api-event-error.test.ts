import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiEventError } from '@/client/errors/parse-api-event-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiEventError', () => {
  it('maps a valid event error and preserves its protocol status', () => {
    expect(
      parseApiEventError({
        code: ErrorCode.AI_UNAVAILABLE,
        status: 503,
        message: 'AI unavailable',
      })
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE, { status: 503 }));
  });

  it('returns UNKNOWN for invalid event error codes', () => {
    expect(
      parseApiEventError({
        code: 'INVALID_CODE',
        status: 503,
        message: 'AI unavailable',
      })
    ).toEqual(new ClientError(ErrorCode.UNKNOWN, { status: 503 }));
  });

  it.each([
    null,
    undefined,
    {},
    { code: ErrorCode.AI_UNAVAILABLE, status: 503 },
    {
      code: ErrorCode.AI_UNAVAILABLE,
      status: '503',
      message: 'AI unavailable',
    },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiEventError(input)).toEqual(new ClientError(ErrorCode.UNKNOWN));
  });
});
