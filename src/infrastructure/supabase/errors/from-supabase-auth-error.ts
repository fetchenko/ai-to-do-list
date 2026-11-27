import { ErrorCode } from '@/shared/errors/code';

export interface AuthErrorInfo {
  code: ErrorCode;
  message: string;
  status: number;
}

/**
 * Converts Supabase Auth errors into application-owned error semantics.
 * Auth errors are not PostgREST errors and have a different contract.
 */
export function fromSupabaseAuthError(error: unknown): AuthErrorInfo {
  const candidate =
    typeof error === 'object' && error !== null
      ? (error as Record<string, unknown>)
      : {};

  const code = typeof candidate.code === 'string' ? candidate.code : undefined;
  const status =
    typeof candidate.status === 'number' ? candidate.status : undefined;

  if (code === 'email_not_confirmed') {
    return {
      code: ErrorCode.UNAUTHORIZED,
      message: 'Please confirm your email before signing in.',
      status: status ?? 401,
    };
  }

  if (
    code === 'invalid_credentials' ||
    code === 'user_not_found' ||
    status === 401
  ) {
    return {
      code: ErrorCode.UNAUTHORIZED,
      message: 'Invalid email or password.',
      status: 401,
    };
  }

  if (status === 403) {
    return {
      code: ErrorCode.FORBIDDEN,
      message: "You don't have permission to perform this action.",
      status,
    };
  }

  if (status === 429) {
    return {
      code: ErrorCode.AUTH_RATE_LIMITED,
      message: 'Too many authentication attempts. Please try again later.',
      status,
    };
  }

  if (status === 400 || status === 422) {
    return {
      code: ErrorCode.INVALID_REQUEST,
      message: 'Unable to complete the authentication request.',
      status,
    };
  }

  if (status !== undefined && status >= 500) {
    return {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Authentication is temporarily unavailable.',
      status,
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: 'Authentication failed. Please try again.',
    status: status ?? 500,
  };
}
