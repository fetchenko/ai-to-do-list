import type { AuthError } from '@supabase/supabase-js';

export const SupabaseAuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  OTP_EXPIRED: 'OTP_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type SupabaseAuthErrorCode =
  (typeof SupabaseAuthErrorCode)[keyof typeof SupabaseAuthErrorCode];

export type ParsedSupabaseAuthError = {
  code: SupabaseAuthErrorCode;
  message: string;
};

const SUPABASE_AUTH_ERROR_MAP: Record<
  string,
  Pick<ParsedSupabaseAuthError, 'code' | 'message'>
> = {
  invalid_credentials: {
    code: SupabaseAuthErrorCode.INVALID_CREDENTIALS,
    message: 'The email or password is incorrect.',
  },
  email_not_confirmed: {
    code: SupabaseAuthErrorCode.EMAIL_NOT_CONFIRMED,
    message: 'Please confirm your email address before signing in.',
  },
  user_already_exists: {
    code: SupabaseAuthErrorCode.USER_ALREADY_EXISTS,
    message: 'An account with this email already exists.',
  },
  weak_password: {
    code: SupabaseAuthErrorCode.WEAK_PASSWORD,
    message: 'The password does not meet the security requirements.',
  },
  email_address_invalid: {
    code: SupabaseAuthErrorCode.INVALID_EMAIL,
    message: 'The email address is invalid.',
  },
  otp_expired: {
    code: SupabaseAuthErrorCode.OTP_EXPIRED,
    message: 'The verification link has expired. Request a new one.',
  },
  session_not_found: {
    code: SupabaseAuthErrorCode.SESSION_EXPIRED,
    message: 'Your session has expired. Please sign in again.',
  },
  refresh_token_not_found: {
    code: SupabaseAuthErrorCode.SESSION_EXPIRED,
    message: 'Your session has expired. Please sign in again.',
  },
  over_request_rate_limit: {
    code: SupabaseAuthErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests. Please try again later.',
  },
};

export function parseSupabaseAuthError(
  error: AuthError | null | undefined
): ParsedSupabaseAuthError {
  if (!error || typeof error !== 'object') {
    return {
      code: SupabaseAuthErrorCode.UNKNOWN,
      message: 'An authentication error occurred.',
    };
  }

  if (error.status === 429) {
    return {
      code: SupabaseAuthErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.',
    };
  }

  const parsed =
    typeof error.code === 'string'
      ? SUPABASE_AUTH_ERROR_MAP[error.code]
      : undefined;

  return (
    parsed ?? {
      code: SupabaseAuthErrorCode.UNKNOWN,
      message: 'An authentication error occurred.',
    }
  );
}
