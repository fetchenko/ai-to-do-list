import { apiEventErrorSchema } from '@/shared/errors/api-error.schema';
import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

export function parseApiEventError(error: unknown): ClientError {
  const result = apiEventErrorSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(ErrorCode.UNKNOWN);
  }

  return new ClientError(result.data.code, result.data.status);
}
