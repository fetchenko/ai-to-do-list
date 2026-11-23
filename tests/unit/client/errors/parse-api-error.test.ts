import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiError } from '@/client/errors/parse-api-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiError', () => {
  it('maps a valid API error and preserves the HTTP response status', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          message: 'AI unavailable',
        },
        503
      )
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE, { status: 503 }));
  });

  it('does not read transport status from the API error body', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: 500,
          message: 'AI unavailable',
        },
        503
      )
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE, { status: 503 }));
  });

  it('returns UNKNOWN and preserves HTTP status for an invalid payload', () => {
    expect(
      parseApiError(
        { code: 'INVALID_CODE', message: 'AI unavailable' },
        503
      )
    ).toEqual(new ClientError(ErrorCode.UNKNOWN, { status: 503 }));
  });

  it.each([
    null,
    undefined,
    'AI unavailable',
    { code: ErrorCode.AI_UNAVAILABLE },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiError(input, 500)).toEqual(
      new ClientError(ErrorCode.UNKNOWN, { status: 500 })
    );
  });
});
