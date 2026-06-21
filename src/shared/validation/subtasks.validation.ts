import z from "zod";

export const subtasksResponseSchema = z.object({
  task_summary: z.string().optional(),
  subtasks: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
    }),
  ),
});
