import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';
import { parseApiError } from '@/client/errors/parse-api-error';

describe('parseApiError', () => {
  it('maps a valid API error to a ClientError', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: 503,
          message: 'AI unavailable',
          details: { provider: 'deepseek' },
        }
      )
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });

  it('ignores transport status from the API error body', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: 500,
          message: 'AI unavailable',
        }
      )
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });

  it('parses an API error without details', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_GENERATION_TIMEOUT,
          status: 504,
          message: 'AI request timed out',
        }
      )
    ).toEqual(new ClientError(ErrorCode.AI_GENERATION_TIMEOUT));
  });

  it('returns UNKNOWN for invalid API error codes', () => {
    expect(
      parseApiError(
        { code: 'INVALID_CODE', status: 503, message: 'AI unavailable' },
        503
      )
    ).toEqual(new ClientError(ErrorCode.UNKNOWN));
  });

  it.each([
    null,
    undefined,
    'AI unavailable',
    { code: ErrorCode.AI_UNAVAILABLE },
  ])('returns UNKNOWN for invalid input: %s', (input) => {
    expect(parseApiError(input, 503)).toEqual(
      new ClientError(ErrorCode.UNKNOWN)
    );
  });

  it('accepts a valid error body even when its status is represented as a string', () => {
    expect(
      parseApiError(
        {
          code: ErrorCode.AI_UNAVAILABLE,
          status: '503',
          message: 'AI unavailable',
        }
      )
    ).toEqual(new ClientError(ErrorCode.AI_UNAVAILABLE));
  });
});
