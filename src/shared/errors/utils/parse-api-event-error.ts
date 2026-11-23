import { apiEventErrorSchema } from '@/shared/errors/api-error.schema';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

export function parseApiEventError(error: unknown): AppError {
  const result = apiEventErrorSchema.safeParse(error);

  if (!result.success) {
    return new AppError(ErrorCode.UNKNOWN, 'Something went wrong.');
  }

  const { code, message, details } = result.data;

  return new AppError(code, message, details);
}
