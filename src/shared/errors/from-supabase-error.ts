import type { PostgrestError } from '@supabase/supabase-js';

import { AppError } from '@/shared/errors/app-error';
import { mapSupabaseErrorCode } from '@/shared/errors/map-supabase-error-code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function fromSupabaseError(error: PostgrestError): AppError {
  const code = mapSupabaseErrorCode(error.code);

  const message =
    code === 'INVALID_REQUEST'
      ? 'This already exists.'
      : code === 'FORBIDDEN'
        ? "You don't have permission to do that."
        : 'Database error';

  return new AppError(code, ErrorHttpStatus[code], message, error);
}
