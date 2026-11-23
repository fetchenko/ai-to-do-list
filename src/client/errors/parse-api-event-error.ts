import { ErrorCode } from '@/shared/errors/code';

import { apiEventErrorResponseSchema } from './api-error-response.schema';
import { ClientError } from './client-error';

export function parseApiEventError(error: unknown): ClientError {
  const result = apiEventErrorResponseSchema.safeParse(error);

  if (!result.success) {
    return new ClientError(ErrorCode.UNKNOWN);
  }

  return new ClientError(result.data.code, {
    status: result.data.status,
  });
}
