import { ClientError } from '@/client/errors/client-error';
import { apiErrorSchema } from '@/shared/errors/api-error.schema';
import { ErrorCode } from '@/shared/errors/code';

export function parseApiError(error: unknown, status: number): ClientError {
  const result = apiErrorSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(
      ErrorCode.UNKNOWN,
      'Something went wrong.',
      { status }
    );
  }

  const { code, message, details } = result.data;

  return new ClientError(code, message, { status, cause: details });
}
