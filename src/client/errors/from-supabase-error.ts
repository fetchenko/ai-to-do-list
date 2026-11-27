import { ClientError } from '@/client/errors/client-error';
import {
  fromSupabaseError,
  isPostgrestError,
} from '@/infrastructure/supabase/errors/from-supabase-error';
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

/**
 * Executes a browser Supabase query and normalizes both returned API errors
 * and rejected transport promises.
 */
export async function runClientSupabaseQuery<T>(
  query: PromiseLike<{ data: T; error: unknown }>
): Promise<T> {
  try {
    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    throw toClientSupabaseError(error);
  }
}
