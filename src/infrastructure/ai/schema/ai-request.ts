import z from 'zod';

export const requestGenSubtasksSchema = z.object({
  taskId: z.uuid('Invalid taskId format'),
});

export type RequestGenSubtasks = z.infer<typeof requestGenSubtasksSchema>;
