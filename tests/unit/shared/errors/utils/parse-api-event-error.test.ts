import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { parseApiEventError } from '@/client/errors/parse-api-event-error';
import { ErrorCode } from '@/shared/errors/code';

describe('parseApiEventError', () => {
  it('parses a valid event error and preserves its status and details', () => {
    const details = { provider: 'deepseek' };

    const result = parseApiEventError({
      success: false,
      code: ErrorCode.AI_UNAVAILABLE,
      status: 503,
      message: 'AI unavailable',
      details,
    });

    expect(result).toBeInstanceOf(ClientError);
    expect(result.code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(result.status).toBe(503);
    expect(result.message).toBe('AI unavailable');
    expect(result.cause).toBe(details);
  });

  it('returns a generic client error for invalid event errors', () => {
    const result = parseApiEventError({
      success: false,
      code: 'INVALID_CODE',
      status: 503,
      message: 'AI unavailable',
    });

    expect(result).toBeInstanceOf(ClientError);
    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.message).toBe('Something went wrong.');
    expect(result.status).toBeUndefined();
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
  ])('returns a generic client error for invalid input: %s', (input) => {
    const result = parseApiEventError(input);

    expect(result).toBeInstanceOf(ClientError);
    expect(result.code).toBe(ErrorCode.UNKNOWN);
    expect(result.message).toBe('Something went wrong.');
  });
});
