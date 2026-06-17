import z from "zod";
import { DeepSeekResponseSchema } from "./deepseek.validation";

export type DeepSeekResponse = z.infer<typeof DeepSeekResponseSchema>;
