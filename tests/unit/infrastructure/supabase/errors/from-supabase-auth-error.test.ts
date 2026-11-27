import { describe, expect, it } from 'vitest';

import { ErrorCode } from '@/shared/errors/code';
import { fromSupabaseAuthError } from '@/infrastructure/supabase/errors/from-supabase-auth-error';

describe('fromSupabaseAuthError', () => {
  it('maps invalid credentials to unauthorized without exposing provider text', () => {
    expect(
      fromSupabaseAuthError({
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
        status: 400,
      })
    ).toEqual({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Invalid email or password.',
      status: 401,
    });
  });

  it('maps unconfirmed email to an actionable unauthorized error', () => {
    expect(
      fromSupabaseAuthError({
        code: 'email_not_confirmed',
        message: 'Email not confirmed',
      })
    ).toEqual({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Please confirm your email before signing in.',
      status: 401,
    });
  });

  it('maps rate limits', () => {
    expect(fromSupabaseAuthError({ status: 429 })).toEqual({
      code: ErrorCode.AUTH_RATE_LIMITED,
      message: 'Too many authentication attempts. Please try again later.',
      status: 429,
    });
  });

  it('maps server failures', () => {
    expect(fromSupabaseAuthError({ status: 503 })).toEqual({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Authentication is temporarily unavailable.',
      status: 503,
    });
  });

  it.each([null, undefined, 'unexpected', {}])(
    'returns a safe fallback for unknown shapes: %s',
    (error) => {
      expect(fromSupabaseAuthError(error)).toEqual({
        code: ErrorCode.UNKNOWN,
        message: 'Authentication failed. Please try again.',
        status: 500,
      });
    }
  );
});
