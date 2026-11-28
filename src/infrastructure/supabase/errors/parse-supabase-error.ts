import type { PostgrestError } from '@supabase/supabase-js';

export const SupabaseErrorCode = {
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION: 'NOT_NULL_VIOLATION',
  CHECK_VIOLATION: 'CHECK_VIOLATION',
  INSUFFICIENT_PRIVILEGE: 'INSUFFICIENT_PRIVILEGE',
  CARDINALITY_VIOLATION: 'CARDINALITY_VIOLATION',
  UNKNOWN: 'UNKNOWN',
} as const;

export type SupabaseErrorCode =
  (typeof SupabaseErrorCode)[keyof typeof SupabaseErrorCode];

export type ParsedSupabaseError = {
  code: SupabaseErrorCode;
  message: string;
};

const SUPABASE_ERROR_MAP: Record<
  string,
  Pick<ParsedSupabaseError, 'code' | 'message'>
> = {
  '23502': {
    code: SupabaseErrorCode.NOT_NULL_VIOLATION,
    message: 'A required value is missing.',
  },
  '23503': {
    code: SupabaseErrorCode.FOREIGN_KEY_VIOLATION,
    message: 'A related record prevents this operation.',
  },
  '23505': {
    code: SupabaseErrorCode.UNIQUE_VIOLATION,
    message: 'This record already exists.',
  },
  '23514': {
    code: SupabaseErrorCode.CHECK_VIOLATION,
    message: 'The provided values violate a database constraint.',
  },
  '42501': {
    code: SupabaseErrorCode.INSUFFICIENT_PRIVILEGE,
    message: "You don't have permission to perform this action.",
  },
  // PostgREST uses PGRST116 when a single-row response has zero or
  // multiple rows; the parser deliberately avoids assuming "not found".
  PGRST116: {
    code: SupabaseErrorCode.CARDINALITY_VIOLATION,
    message: 'The database returned an unexpected number of records.',
  },
};

export function parseSupabaseError(
  error: PostgrestError | null | undefined
): ParsedSupabaseError {
  if (!error || typeof error !== 'object') {
    return {
      code: SupabaseErrorCode.UNKNOWN,
      message: 'A database error occurred.',
    };
  }

  const parsed =
    typeof error.code === 'string'
      ? SUPABASE_ERROR_MAP[error.code]
      : undefined;

  return (
    parsed ?? {
      code: SupabaseErrorCode.UNKNOWN,
      message: 'A database error occurred.',
    }
  );
}
