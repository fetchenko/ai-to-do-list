import type { PostgrestError } from '@supabase/supabase-js';

export const DatabaseErrorCode = {
  UNIQUE_VIOLATION: 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NOT_NULL_VIOLATION: 'NOT_NULL_VIOLATION',
  CHECK_VIOLATION: 'CHECK_VIOLATION',
  INSUFFICIENT_PRIVILEGE: 'INSUFFICIENT_PRIVILEGE',
  CARDINALITY_VIOLATION: 'CARDINALITY_VIOLATION',
  UNKNOWN: 'UNKNOWN',
} as const;

export type DatabaseErrorCode =
  (typeof DatabaseErrorCode)[keyof typeof DatabaseErrorCode];

export type ParsedDatabaseError = {
  code: DatabaseErrorCode;
  message: string;
};

const DATABASE_ERROR_MAP: Record<
  string,
  Pick<ParsedDatabaseError, 'code' | 'message'>
> = {
  '23502': {
    code: DatabaseErrorCode.NOT_NULL_VIOLATION,
    message: 'A required value is missing.',
  },
  '23503': {
    code: DatabaseErrorCode.FOREIGN_KEY_VIOLATION,
    message: 'A related record prevents this operation.',
  },
  '23505': {
    code: DatabaseErrorCode.UNIQUE_VIOLATION,
    message: 'This record already exists.',
  },
  '23514': {
    code: DatabaseErrorCode.CHECK_VIOLATION,
    message: 'The provided values violate a database constraint.',
  },
  '42501': {
    code: DatabaseErrorCode.INSUFFICIENT_PRIVILEGE,
    message: "You don't have permission to perform this action.",
  },
  // PGRST116 means a single-row response returned zero or multiple rows.
  PGRST116: {
    code: DatabaseErrorCode.CARDINALITY_VIOLATION,
    message: 'The database returned an unexpected number of records.',
  },
};

const UNKNOWN_DATABASE_ERROR: ParsedDatabaseError = {
  code: DatabaseErrorCode.UNKNOWN,
  message: 'A database error occurred.',
};

export function parseDatabaseError(
  error: PostgrestError | null | undefined
): ParsedDatabaseError {
  if (!error || typeof error !== 'object') {
    return UNKNOWN_DATABASE_ERROR;
  }

  return (typeof error.code === 'string' && DATABASE_ERROR_MAP[error.code]) ||
    UNKNOWN_DATABASE_ERROR;
}
