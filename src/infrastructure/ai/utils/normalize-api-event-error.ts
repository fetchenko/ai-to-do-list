import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { ErrorHttpStatus } from '@/infrastructure/http/error-http-status';
import { ApiEventError } from '@/shared/errors/api-error.schema';

export function normalizeApiEventError(err: unknown): ApiEventError {
  const normalizedError = normalizeApiError(err);

  return {
    ...normalizedError,
    status: ErrorHttpStatus[normalizedError.code],
  };
}
