import { z } from 'zod';

const serverEnvSchema = z
  .object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    AI_PROVIDER: z.enum(['deepseek', 'ollama']).default('deepseek'),
    DEEPSEEK_KEY: z.string().min(1).optional(),
  })
  .refine((env) => env.AI_PROVIDER !== 'deepseek' || !!env.DEEPSEEK_KEY, {
    message: 'DEEPSEEK_KEY is required when AI_PROVIDER is "deepseek"',
    path: ['DEEPSEEK_KEY'],
  });

const parsed = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  AI_PROVIDER: process.env.AI_PROVIDER,
  DEEPSEEK_KEY: process.env.DEEPSEEK_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid server environment variables:\n${z.prettifyError(parsed.error)}`
  );
}

export const serverEnv = parsed.data;
