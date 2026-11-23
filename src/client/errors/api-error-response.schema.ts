import { z } from 'zod';

import { ErrorCode } from '@/shared/errors/code';

/**
 * The error response shape expected by the frontend.
 *
 * HTTP status is read from the Response object, not from this payload.
 */
export const apiErrorResponseSchema = z.object({
  code: z.enum(ErrorCode),
  message: z.string(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Error payload sent in a terminal server-sent event.
 *
 * Unlike an initial HTTP error response, this event carries its own status
 * because the HTTP response has already started successfully.
 */
export const apiEventErrorResponseSchema = apiErrorResponseSchema.extend({
  status: z.number().int().min(400).max(599),
});

export type ApiEventErrorResponse = z.infer<
  typeof apiEventErrorResponseSchema
>;
