import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

describe('ClientError', () => {
  it('stores a frontend-facing error code without backend details', () => {
    const error = new ClientError(ErrorCode.AI_UNAVAILABLE);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ClientError');
    expect(error.code).toBe(ErrorCode.AI_UNAVAILABLE);
    expect(error.message).toBe('Client operation failed');
    expect('status' in error).toBe(false);
    expect('details' in error).toBe(false);
  });

  it('preserves the standard Error cause option', () => {
    const cause = new Error('Underlying failure');
    const error = new ClientError(ErrorCode.UNKNOWN, { cause });

    expect(error.cause).toBe(cause);
  });
});
