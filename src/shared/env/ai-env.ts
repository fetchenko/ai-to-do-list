import { z } from 'zod';

const aiEnvSchema = z
  .object({
    AI_PROVIDER: z.enum(['deepseek', 'ollama']).default('deepseek'),
    DEEPSEEK_KEY: z.string().min(1).optional(),
  })
  .refine((env) => env.AI_PROVIDER !== 'deepseek' || !!env.DEEPSEEK_KEY, {
    message: 'DEEPSEEK_KEY is required when AI_PROVIDER is "deepseek"',
    path: ['DEEPSEEK_KEY'],
  });

const parsed = aiEnvSchema.safeParse({
  AI_PROVIDER: process.env.AI_PROVIDER,
  DEEPSEEK_KEY: process.env.DEEPSEEK_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid AI provider environment variables:\n${z.prettifyError(parsed.error)}`
  );
}

export const aiEnv = parsed.data;
