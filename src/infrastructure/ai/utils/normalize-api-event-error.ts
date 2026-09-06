import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { ApiEventError } from '@/shared/errors/api-error.schema';
import { getHttpStatusCode } from '@/shared/errors/utils/get-http-status-code';

export function normalizeApiEventError(err: unknown): ApiEventError {
  const normalizedError = normalizeApiError(err);

  return {
    ...normalizedError,
    status: getHttpStatusCode(normalizedError.code),
  };
}
