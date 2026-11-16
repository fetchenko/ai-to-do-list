import z from 'zod';

export const subtaskResponseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});
