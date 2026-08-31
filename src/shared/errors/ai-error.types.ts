import type { ApiError } from '@/shared/errors/api-error.schema';

export type AiErrorResult = ApiError & {
  success: false;
};
