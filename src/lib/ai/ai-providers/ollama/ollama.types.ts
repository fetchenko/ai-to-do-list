import z from "zod";
import { OllamaChatResponseSchema } from "./ollama.validation";

export type OllamaResponse = z.infer<typeof OllamaChatResponseSchema>;
