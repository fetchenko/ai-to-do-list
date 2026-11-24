import { apiErrorSchema } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

export function parseApiError(error: unknown): AppError {
  const result = apiErrorSchema.safeParse(error);

  if (!result.success) {
    return new AppError(ErrorCode.UNKNOWN, 'Something went wrong.');
  }

  const { code, message, details } = result.data;

  return new AppError(code, message, details);
}
