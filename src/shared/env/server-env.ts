import { z } from 'zod';

const supabaseServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = supabaseServerEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!parsed.success) {
  throw new Error(
    `Invalid Supabase server environment variables:\n${z.prettifyError(parsed.error)}`
  );
}

export const supabaseServerEnv = parsed.data;
