import z from "zod";

export const subtasksSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
    }),
  ),
});

export const subtasksResponseSchema = z.object({
  task_summary: z.string().optional(),
  subtasks: subtasksSchema,
});
