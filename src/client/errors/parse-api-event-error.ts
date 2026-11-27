import { apiEventErrorSchema } from '@/shared/errors/api-error.schema';
import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

export function parseApiEventError(error: unknown): ClientError {
  const result = apiEventErrorSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(
      ErrorCode.UNKNOWN,
      'Something went wrong.'
    );
  }

  const { code, message, status, details } = result.data;

  return new ClientError(code, message, { status, cause: details });
}
