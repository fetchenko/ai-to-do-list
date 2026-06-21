import { z } from "zod";

export const taskSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 3 characters")
    .max(100, "Title is too long"),

  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .or(z.literal("")),
});
