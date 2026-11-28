import type { ParsedSupabaseError } from '@/infrastructure/supabase/errors/parse-supabase-error';
import { SupabaseErrorCode } from '@/infrastructure/supabase/errors/parse-supabase-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function toAppError(error: ParsedSupabaseError): AppError {
  const code =
    error.code === SupabaseErrorCode.UNIQUE_VIOLATION
      ? ErrorCode.INVALID_REQUEST
      : error.code === SupabaseErrorCode.INSUFFICIENT_PRIVILEGE
        ? ErrorCode.FORBIDDEN
        : ErrorCode.DATABASE_ERROR;

  return new AppError(code, ErrorHttpStatus[code], error.message, error);
}
