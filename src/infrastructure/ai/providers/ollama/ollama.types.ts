import z from "zod";
import { ollamaChatResponseSchema } from "./ollama.validation";

export type OllamaResponse = z.infer<typeof ollamaChatResponseSchema>;
