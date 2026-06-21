import z from "zod";
import { subtasksResponseSchema } from "../validation/subtasks.validation";

export type SubtasksResponse = z.infer<typeof subtasksResponseSchema>;
