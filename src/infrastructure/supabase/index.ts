export { supabaseAdmin } from '@/infrastructure/supabase/admin';
export { createClient } from '@/infrastructure/supabase/client';
export { updateSession } from '@/infrastructure/supabase/proxy';
export { createClient as createServerClient } from '@/infrastructure/supabase/server';

export type {
  DbAiGenerationUpdate,
} from '@/infrastructure/supabase/types/database-ai.types';
export type {
  DbTask,
  DbTaskForSubtaskGeneration,
  DbTaskInsert,
  DbTaskRow,
  DbTaskUpdate,
} from '@/infrastructure/supabase/types/database-task.types';
export type { Database } from '@/infrastructure/supabase/types/database.types';

export type {
  EmailOtpType,
  JwtPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
