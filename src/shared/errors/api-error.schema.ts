import { z } from 'zod';

import { ErrorCode } from '@/shared/errors/code';

export const apiErrorSchema = z.object({
  success: z.boolean().optional(),
  code: z.enum(ErrorCode),
  message: z.string(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

export const apiEventErrorSchema = apiErrorSchema.extend({
  status: z.number().int().min(400).max(599),
});

export type ApiEventError = z.infer<typeof apiEventErrorSchema>;
