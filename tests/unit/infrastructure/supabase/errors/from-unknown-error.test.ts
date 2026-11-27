import { describe, expect, it } from 'vitest';

import { ErrorCode } from '@/shared/errors/code';
import { fromUnknownError } from '@/infrastructure/supabase/errors/from-unknown-error';

describe('fromUnknownError', () => {
  it('maps fetch TypeErrors to network errors', () => {
    expect(fromUnknownError(new TypeError('Failed to fetch'))).toEqual({
      code: ErrorCode.NETWORK_ERROR,
      message: 'Unable to connect. Check your connection and try again.',
      status: 503,
    });
  });

  it('maps unexpected values to a safe internal error', () => {
    expect(fromUnknownError({ unexpected: true })).toEqual({
      code: ErrorCode.UNKNOWN,
      message: 'Something went wrong. Please try again.',
      status: 500,
    });
  });
});
