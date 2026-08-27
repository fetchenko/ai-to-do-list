import z from 'zod';

export const ollamaChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),

  response: z.string(),
  done: z.boolean(),
  done_reason: z.string(),

  context: z.array(z.number()).optional(),

  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export const ollamaStreamChunkSchema = z.object({
  model: z.string(),
  created_at: z.string(),

  message: z
    .object({
      role: z.string(),
      content: z.string().optional(),

      tool_calls: z
        .array(
          z.object({
            id: z.string().optional(),

            function: z.object({
              index: z.number().optional(),
              name: z.string(),
              arguments: z.record(z.string(), z.unknown()),
            }),
          })
        )
        .optional(),
    })
    .optional(),

  done: z.boolean(),
  done_reason: z.string().optional(),

  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),

  error: z.string().optional(),
});

export type OllamaStreamChunk = z.infer<typeof ollamaStreamChunkSchema>;

export type OllamaResponse = z.infer<typeof ollamaChatResponseSchema>;
