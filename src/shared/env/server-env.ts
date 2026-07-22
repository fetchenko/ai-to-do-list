import 'server-only';
import { z } from 'zod';

/**
 * Server-only secrets. The `server-only` import above makes this a build
 * error if any client component ever imports this module, even indirectly —
 * that's the actual enforcement, not just convention.
 */
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
