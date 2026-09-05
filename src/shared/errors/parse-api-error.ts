import { apiErrorSchema } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export function parseApiError(error: unknown, status: number): AppError {
  const result = apiErrorSchema.safeParse(error);

  if (!result.success) {
    return new AppError(
      ErrorCode.UNKNOWN,
      ErrorHttpStatus[ErrorCode.UNKNOWN],
      'Something went wrong.'
    );
  }

  const { code, message, details } = result.data;

  return new AppError(code, status, message, details);
}
