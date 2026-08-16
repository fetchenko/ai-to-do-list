import z from 'zod';

export const ollamaChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),

  response: z.string(),
  done: z.boolean(),
  done_reason: z.string().optional(),

  context: z.array(z.number()).optional(),

  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export type OllamaResponse = z.infer<typeof ollamaChatResponseSchema>;
