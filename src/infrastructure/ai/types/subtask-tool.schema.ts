import z from 'zod';

export const subtaskToolSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export type SubtaskResponse = z.infer<typeof subtaskToolSchema>;
