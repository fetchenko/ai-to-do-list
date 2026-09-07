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

const ollamaToolCallSchema = z.object({
  id: z.string().optional(),

  function: z.object({
    index: z.number().optional(),
    name: z.string(),
    arguments: z.record(z.string(), z.unknown()),
  }),
});

const ollamaMessageSchema = z.object({
  role: z.string(),
  content: z.string().optional(),
  tool_calls: z.array(ollamaToolCallSchema).optional(),
});

export const ollamaStreamMessageChunkSchema = z.object({
  model: z.string(),
  created_at: z.string(),

  message: ollamaMessageSchema,

  done: z.literal(false),
});

export const ollamaStreamDoneChunkSchema = z.object({
  model: z.string(),
  created_at: z.string(),

  done: z.literal(true),
  done_reason: z.string().optional(),

  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional(),
});

export const ollamaStreamErrorSchema = z.object({
  error: z.string(),
});

export const ollamaStreamChunkSchema = z.union([
  ollamaStreamMessageChunkSchema,
  ollamaStreamDoneChunkSchema,
  ollamaStreamErrorSchema,
]);

export type OllamaStreamError = z.infer<typeof ollamaStreamErrorSchema>;

export type OllamaStreamDoneChunk = z.infer<typeof ollamaStreamDoneChunkSchema>;

export type OllamaStreamMessageChunk = z.infer<
  typeof ollamaStreamMessageChunkSchema
>;

export type OllamaStreamChunk = z.infer<typeof ollamaStreamChunkSchema>;

export type OllamaResponse = z.infer<typeof ollamaChatResponseSchema>;
