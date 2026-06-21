import z from "zod";
import { deepSeekResponseSchema } from "./deepseek.validation";

export type DeepSeekResponse = z.infer<typeof deepSeekResponseSchema>;
