import type { PostgrestError } from '@supabase/supabase-js';

export type ParsedSupabaseError = {
  code: string;
  message: string;
};

const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  '23502': 'A required value is missing.',
  '23503': 'The requested record is referenced by another record.',
  '23505': 'This record already exists.',
  '23514': 'The provided values are invalid.',
  '42501': "You don't have permission to perform this action.",
  'PGRST116': 'The requested record was not found.',
};

const UNKNOWN_SUPABASE_ERROR: ParsedSupabaseError = {
  code: 'SUPABASE_ERROR',
  message: 'A database error occurred.',
};

/**
 * Converts a Supabase/PostgREST error into a stable, provider-level shape.
 * It deliberately does not create AppError or ClientError: callers decide
 * how this normalized error should be exposed in their execution context.
 */
export function parseSupabaseError(
  error: PostgrestError | null | undefined
): ParsedSupabaseError {
  if (!error || typeof error !== 'object') {
    return UNKNOWN_SUPABASE_ERROR;
  }

  const code =
    typeof error.code === 'string' && error.code.trim()
      ? error.code
      : UNKNOWN_SUPABASE_ERROR.code;

  return {
    code,
    message: SUPABASE_ERROR_MESSAGES[code] ?? UNKNOWN_SUPABASE_ERROR.message,
  };
}
