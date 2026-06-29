import z from 'zod';

export const requestGenSubtasksSchema = z.object({
  taskId: z.string(),
});
