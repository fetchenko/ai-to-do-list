import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title is too long'),

  description: z
    .string()
    .max(1000, 'Description is too long')
    .optional()
    .or(z.literal('')),
});

export type TaskForm = z.infer<typeof taskSchema>;

export const draftSchema = z.object({
  drafts: z.array(
    z.object({
      id: z.string(),
      title: z.string().trim().min(1, 'Title is required'),
      description: z.string().optional(),
    })
  ),
});

export type DraftForm = z.infer<typeof draftSchema>;
