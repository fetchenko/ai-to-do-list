import z from "zod";

export const DeepSeekResponseSchema = z.object({
  id: z.string().optional(),
  model: z.string().optional(),

  choices: z.array(
    z.object({
      finish_reason: z.string().optional(),

      message: z.object({
        content: z.string(),
      }),
    }),
  ),

  usage: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),

      prompt_cache_hit_tokens: z.number().optional(),
      prompt_cache_miss_tokens: z.number().optional(),

      completion_tokens_details: z
        .object({
          reasoning_tokens: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
});
