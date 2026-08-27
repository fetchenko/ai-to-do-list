import z from 'zod';

const deepSeekUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),

  prompt_cache_hit_tokens: z.number(),
  prompt_cache_miss_tokens: z.number(),

  completion_tokens_details: z
    .object({
      reasoning_tokens: z.number(),
    })
    .optional(),
});

export const deepSeekResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),

  choices: z.array(
    z.object({
      finish_reason: z.string().optional(),

      message: z.object({
        content: z.string(),
      }),
    })
  ),

  usage: deepSeekUsageSchema,
});

export const deepSeekStreamChunkSchema = z.object({
  id: z.string(),
  object: z.literal('chat.completion.chunk'),
  created: z.number(),
  model: z.string(),
  system_fingerprint: z.string(),

  choices: z.array(
    z.object({
      index: z.number(),

      delta: z.object({
        role: z.literal('assistant').optional(),

        content: z.string().nullable().optional(),

        reasoning_content: z.string().nullable().optional(),

        tool_calls: z
          .array(
            z.object({
              index: z.number(),
              id: z.string().optional(),
              type: z.literal('function').optional(),

              function: z
                .object({
                  name: z.string().optional(),
                  arguments: z.string().optional(),
                })
                .optional(),
            })
          )
          .optional(),
      }),

      finish_reason: z
        .enum([
          'stop',
          'length',
          'content_filter',
          'tool_calls',
          'insufficient_system_resource',
        ])
        .nullable(),
    })
  ),

  usage: deepSeekUsageSchema.optional(),
});

export type DeepSeekUsage = z.infer<typeof deepSeekUsageSchema>;

export type DeepSeekStreamChunk = z.infer<typeof deepSeekStreamChunkSchema>;

export type DeepSeekResponse = z.infer<typeof deepSeekResponseSchema>;
