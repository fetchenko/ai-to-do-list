import type { PostgrestError } from '@supabase/supabase-js';

import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

/**
 * Maps errors returned by Supabase's PostgREST API to frontend errors.
 *
 * These errors originate from database operations performed through the
 * Supabase client. Database messages and details are intentionally not exposed
 * to the UI; only a safe, application-level error code is propagated.
 */
export function fromSupabaseError(error: PostgrestError): ClientError {
  switch (error.code) {
    case '23505': // unique_violation: a value violates a unique constraint.
      return new ClientError(ErrorCode.INVALID_REQUEST);
    case '42501': // insufficient_privilege: the operation is not permitted.
      return new ClientError(ErrorCode.FORBIDDEN);
    default:
      return new ClientError(ErrorCode.DATABASE_ERROR);
  }
}
