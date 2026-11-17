import z from 'zod';

export const subtaskResponseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const subtasksResponseSchema = z.object({
  task_summary: z.string().optional(),
  subtasks: z.array(subtaskResponseSchema),
});
