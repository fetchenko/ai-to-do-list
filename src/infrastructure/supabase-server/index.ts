import 'server-only';

export { createClient as createServerClient } from '@/infrastructure/supabase/server';
export type { JwtPayload } from '@/infrastructure/supabase';
