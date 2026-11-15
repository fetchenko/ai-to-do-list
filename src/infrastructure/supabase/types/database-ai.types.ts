import { Database } from '@/infrastructure/supabase/types/database.types';

export type DbAiGenerationUpdate =
  Database['public']['Tables']['ai_generations']['Update'];
