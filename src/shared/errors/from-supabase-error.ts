import type { PostgrestError } from '@supabase/supabase-js';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { mapSupabaseErrorCode } from '@/shared/errors/map-supabase-error-code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

const errorMessages: Partial<Record<ErrorCode, string>> = {
  [ErrorCode.INVALID_REQUEST]: 'This already exists.',
  [ErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ErrorCode.DATABASE_ERROR]: 'Database error',
};

export function fromSupabaseError(error: PostgrestError): AppError {
  const code = mapSupabaseErrorCode(error.code);

  return new AppError(
    code,
    ErrorHttpStatus[code],
    errorMessages[code] ?? 'Database error',
    code === ErrorCode.DATABASE_ERROR ? error : undefined
  );
}
