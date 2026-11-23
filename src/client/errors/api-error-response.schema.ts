import { z } from 'zod';

import { ErrorCode } from '@/shared/errors/code';

/**
 * The API error payload shape expected by the frontend.
 *
 * HTTP status is transport metadata and is intentionally not part of the
 * frontend error representation.
 */
export const apiErrorResponseSchema = z.object({
  code: z.enum(ErrorCode),
  message: z.string(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
