import type { PostgrestError } from '@/infrastructure/supabase';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function toDatabaseAppError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505':
      return new AppError(
        ErrorCode.INVALID_REQUEST,
        ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
        'This record already exists.',
        error
      );

    case '42501':
      return new AppError(
        ErrorCode.FORBIDDEN,
        ErrorHttpStatus[ErrorCode.FORBIDDEN],
        "You don't have permission to perform this action.",
        error
      );

    default:
      return new AppError(
        ErrorCode.DATABASE_ERROR,
        ErrorHttpStatus[ErrorCode.DATABASE_ERROR],
        'A database error occurred.',
        error
      );
  }
}
