import { Database } from '@/infrastructure/supabase/types/database.types';

export type DbTaskRow = Database['public']['Tables']['tasks']['Row'];
export type DbTask = DbTaskRow;

export type DbTaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type DbTaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type DbTaskForSubtaskGeneration = Pick<
  DbTask,
  'id' | 'user_id' | 'title'
>;
