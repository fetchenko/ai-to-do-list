import { ErrorCode } from '@/shared/errors/code';

export function mapSupabaseErrorCode(code: string): ErrorCode {
  switch (code) {
    case '23505': // unique_violation: a value violates a unique constraint.
      return ErrorCode.INVALID_REQUEST;
    case '42501': // insufficient_privilege: the operation is not permitted.
      return ErrorCode.FORBIDDEN;
    default:
      return ErrorCode.DATABASE_ERROR;
  }
}
