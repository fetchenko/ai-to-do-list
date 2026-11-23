import type { PostgrestError } from '@supabase/supabase-js';

import { mapSupabaseErrorCode } from '@/shared/errors/map-supabase-error-code';

import { ClientError } from './client-error';

/**
 * Maps errors returned by Supabase's PostgREST API to frontend errors.
 *
 * Database messages and details are intentionally not exposed to the UI;
 * only a safe, application-level error code is propagated.
 */
export function fromSupabaseError(error: PostgrestError): ClientError {
  return new ClientError(mapSupabaseErrorCode(error.code));
}
