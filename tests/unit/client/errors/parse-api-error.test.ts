import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiError } from '@/client/errors/parse-api-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiError', () => {
  it('parses a valid API error into a ClientError', () => {
    const details = { provider: 'deepseek' };
    const result = parseApiError(
      {
        code: ErrorCode.AI_UNAVAILABLE,
        message: 'AI unavailable',
        details,
      },
      503
    );

    expect(result).toBeInstanceOf(ClientError);
    expect(result.code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(result.status).toBe(503);
    expect(result.message).toBe('AI unavailable');
    expect(result.cause).toBe(details);
  });

  it('uses the HTTP response status rather than a status in the body', () => {
    const result = parseApiError(
      {
        code: ErrorCode.AI_UNAVAILABLE,
        status: 500,
        message: 'AI unavailable',
      },
      503
    );

    expect(result.status).toBe(503);
  });

  it('returns a generic client error for an invalid API error', () => {
    const result = parseApiError(
      { code: 'INVALID_CODE', message: 'AI unavailable' },
      503
    );

    expect(result).toBeInstanceOf(ClientError);
    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.status).toBe(503);
    expect(result.message).toBe('Something went wrong.');
  });

  it.each([null, undefined, 'invalid', { code: ErrorCode.AI_UNAVAILABLE }])(
    'returns a generic client error for invalid input: %s',
    (input) => {
      const result = parseApiError(input, 503);

      expect(result).toBeInstanceOf(ClientError);
      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.status).toBe(503);
    }
  );
});
