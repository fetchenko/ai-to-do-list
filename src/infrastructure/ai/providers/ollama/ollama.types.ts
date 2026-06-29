import z from 'zod';

import { ollamaChatResponseSchema } from '@/infrastructure/ai/providers/ollama/ollama.validation';

export type OllamaResponse = z.infer<typeof ollamaChatResponseSchema>;
