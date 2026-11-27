import { ClientError } from '@/client/errors/client-error';
import { fromSupabaseError, isPostgrestError } from '@/infrastructure/supabase/errors/from-supabase-error';
import { fromUnknownError } from '@/infrastructure/supabase/errors/from-unknown-error';

/**
 * Converts either a returned PostgREST error or a thrown transport/unknown
 * exception into the error type consumed by client-side application code.
 */
export function toClientSupabaseError(error: unknown): ClientError {
  const mapped = isPostgrestError(error)
    ? fromSupabaseError(error)
    : fromUnknownError(error);

  return new ClientError(mapped.code, mapped.message, {
    cause: error,
    status: 'status' in mapped ? mapped.status : undefined,
  });
}
