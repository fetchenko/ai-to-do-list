import { PostgrestError } from '@supabase/supabase-js';

import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function fromSupabaseError(error: PostgrestError): AppError {
  switch (error.code) {
    case '23505':
      return new AppError(
        ErrorCode.INVALID_REQUEST,
        ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
        'This already exists.'
      );
    case '42501':
      return new AppError(
        ErrorCode.FORBIDDEN,
        ErrorHttpStatus[ErrorCode.FORBIDDEN],
        "You don't have permission to do that."
      );
    default:
      return new AppError(
        ErrorCode.DATABASE_ERROR,
        ErrorHttpStatus[ErrorCode.DATABASE_ERROR],
        'Database error',
        error
      );
  }
}
