export { supabaseAdmin } from './admin';
export { createClient } from './client';
export { updateSession } from './proxy';
export { createClient as createServerClient } from './server';

export type {
  DbAiGenerationUpdate,
} from './types/database-ai.types';
export type {
  DbTask,
  DbTaskForSubtaskGeneration,
  DbTaskInsert,
  DbTaskRow,
  DbTaskUpdate,
} from './types/database-task.types';
export type { Database } from './types/database.types';

export type {
  EmailOtpType,
  JwtPayload,
  SupabaseClient,
} from '@supabase/supabase-js';
