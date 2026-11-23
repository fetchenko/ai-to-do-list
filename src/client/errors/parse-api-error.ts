import { apiErrorSchema } from '@/shared/errors/api-error.schema';
import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

export function parseApiError(error: unknown): ClientError {
  const result = apiErrorSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(ErrorCode.UNKNOWN);
  }

  return new ClientError(result.data.code);
}
