import type { AuthError } from '@supabase/supabase-js';

export const AuthErrorCode = {
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

export type AuthErrorCode =
  (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

export type ParsedAuthError = {
  code: AuthErrorCode;
  message: string;
};

const AUTH_ERROR_MAP: Record<
  string,
  Pick<ParsedAuthError, 'code' | 'message'>
> = {
  invalid_credentials: {
    code: AuthErrorCode.INVALID_CREDENTIALS,
    message: 'The email or password is incorrect.',
  },
  email_not_confirmed: {
    code: AuthErrorCode.EMAIL_NOT_CONFIRMED,
    message: 'Please confirm your email address before signing in.',
  },
  user_already_exists: {
    code: AuthErrorCode.USER_ALREADY_EXISTS,
    message: 'An account with this email already exists.',
  },
  weak_password: {
    code: AuthErrorCode.WEAK_PASSWORD,
    message: 'The password does not meet the security requirements.',
  },
  email_address_invalid: {
    code: AuthErrorCode.INVALID_EMAIL,
    message: 'The email address is invalid.',
  },
  otp_expired: {
    code: AuthErrorCode.OTP_EXPIRED,
    message: 'The verification link has expired. Request a new one.',
  },
  session_not_found: {
    code: AuthErrorCode.SESSION_EXPIRED,
    message: 'Your session has expired. Please sign in again.',
  },
  refresh_token_not_found: {
    code: AuthErrorCode.SESSION_EXPIRED,
    message: 'Your session has expired. Please sign in again.',
  },
  over_request_rate_limit: {
    code: AuthErrorCode.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests. Please try again later.',
  },
};

const UNKNOWN_AUTH_ERROR: ParsedAuthError = {
  code: AuthErrorCode.UNKNOWN,
  message: 'An authentication error occurred.',
};

export function parseAuthError(
  error: AuthError | null | undefined
): ParsedAuthError {
  if (!error || typeof error !== 'object') {
    return UNKNOWN_AUTH_ERROR;
  }

  if (error.status === 429) {
    return {
      code: AuthErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests. Please try again later.',
    };
  }

  return (typeof error.code === 'string' && AUTH_ERROR_MAP[error.code]) ||
    UNKNOWN_AUTH_ERROR;
}
