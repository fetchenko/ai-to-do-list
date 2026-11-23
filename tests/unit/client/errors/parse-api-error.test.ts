import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiError } from '@/client/errors/parse-api-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiError', () => {
  it('maps a valid API error code to a ClientError', () => {
    expect(
      parseApiError({
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'AI unavailable',
      })
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });

  it('ignores transport metadata in the API error payload', () => {
    expect(
      parseApiError({
        code: ErrorCode.AI_UNAVAILABLE,
        status: 503,
        message: 'AI unavailable',
      })
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });

  it('returns UNKNOWN for an invalid error code', () => {
    expect(
      parseApiError({ code: 'INVALID_CODE', message: 'AI unavailable' })
    ).toEqual(new ClientError(ErrorCode.UNKNOWN));
  });

  it.each([
    null,
    undefined,
    'AI unavailable',
    { code: ErrorCode.AI_UNAVAILABLE },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiError(input)).toEqual(new ClientError(ErrorCode.UNKNOWN));
  });
});
