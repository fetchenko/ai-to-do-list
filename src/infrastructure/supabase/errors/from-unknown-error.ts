import { ErrorCode } from '@/shared/errors/code';

export interface UnknownErrorInfo {
  code: ErrorCode;
  message: string;
  status: number;
}

/** Maps thrown exceptions that are not returned Supabase service errors. */
export function fromUnknownError(error: unknown): UnknownErrorInfo {
  if (
    error instanceof TypeError ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof error.name === 'string' &&
      error.name.toLowerCase().includes('fetch'))
  ) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      message: 'Unable to connect. Check your connection and try again.',
      status: 503,
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: 'Something went wrong. Please try again.',
    status: 500,
  };
}
