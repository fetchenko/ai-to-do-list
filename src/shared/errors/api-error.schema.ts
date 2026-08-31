import { z } from 'zod';

import { ErrorCode } from '@/shared/errors/code';

export const apiErrorSchema = z.object({
  code: z.enum(ErrorCode),
  status: z.number().int().min(400).max(599),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
