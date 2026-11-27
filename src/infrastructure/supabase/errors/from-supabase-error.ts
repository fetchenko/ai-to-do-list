import type { PostgrestError } from '@supabase/supabase-js';

import { ErrorCode } from '@/shared/errors/code';

export interface SupabaseErrorInfo {
  code: ErrorCode;
  message: string;
}

export function isPostgrestError(error: unknown): error is PostgrestError {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as Record<string, unknown>;

  return (
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string' &&
    (candidate.details === null || typeof candidate.details === 'string') &&
    (candidate.hint === null || typeof candidate.hint === 'string')
  );
}

export function fromSupabaseError(
  error: Pick<PostgrestError, 'code'>
): SupabaseErrorInfo {
  switch (error.code) {
    case '23505':
      return {
        code: ErrorCode.INVALID_REQUEST,
        message: 'This already exists.',
      };
    case '42501':
      return {
        code: ErrorCode.FORBIDDEN,
        message: "You don't have permission to do that.",
      };
    default:
      return {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database error',
      };
  }
}
