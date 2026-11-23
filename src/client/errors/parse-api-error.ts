import { ErrorCode } from '@/shared/errors/code';

import { apiErrorResponseSchema } from './api-error-response.schema';
import { ClientError } from './client-error';

export function parseApiError(error: unknown): ClientError {
  const result = apiErrorResponseSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(ErrorCode.UNKNOWN);
  }

  return new ClientError(result.data.code);
}
