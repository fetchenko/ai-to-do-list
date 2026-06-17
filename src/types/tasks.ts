import { SubtasksResponseSchema } from "@/lib/validation/task";
import z from "zod";

export type SubtasksResponse = z.infer<typeof SubtasksResponseSchema>;
