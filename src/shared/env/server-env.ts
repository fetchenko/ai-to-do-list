import { z } from 'zod';

/**
 * Server-only secrets (service role key, AI provider credentials).
 *
 * No `server-only` import here on purpose: `server-only` throws
 * unconditionally outside Next.js's own compiler, because its no-op
 * variant is only resolved via the "react-server" export condition,
 * which Next's bundler sets and nothing else does. Playwright's test
 * runner (e2e/fixtures/tasks.fixture.ts imports admin.ts for direct,
 * RLS-bypassing DB setup) does not set that condition, so it would
 * throw here even though there is no actual client-bundle leak.
 *
 * This module is verified to never be imported from a 'use client'
 * file, including type-only imports — keep it that way by not
 * importing it (or admin.ts / ai-provider.ts / deepseek.provider.ts)
 * from client components.
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
