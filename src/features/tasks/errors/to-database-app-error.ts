import { DatabaseErrorCode, type ParsedDatabaseError } from '@/infrastructure/supabase/errors/database/parse-database-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function toDatabaseAppError(error: ParsedDatabaseError): AppError {
  const code =
    error.code === DatabaseErrorCode.UNIQUE_VIOLATION
      ? ErrorCode.INVALID_REQUEST
      : error.code === DatabaseErrorCode.INSUFFICIENT_PRIVILEGE
        ? ErrorCode.FORBIDDEN
        : ErrorCode.DATABASE_ERROR;

  return new AppError(code, ErrorHttpStatus[code], error.message, error);
}
