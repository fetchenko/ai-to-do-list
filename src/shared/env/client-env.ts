import { z } from 'zod';

/**
 * Client-safe env vars only. Every key here must be NEXT_PUBLIC_* — anything
 * else will be `undefined` in the browser bundle, because Next.js inlines
 * NEXT_PUBLIC_* vars via static text replacement of the literal
 * `process.env.NEXT_PUBLIC_X` expression at build time. It does not exist as
 * a real object in the browser, so this schema must list each key
 * explicitly (no `process.env` spreading) for the replacement to work.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid client environment variables:\n${z.prettifyError(parsed.error)}`
  );
}

export const clientEnv = parsed.data;
