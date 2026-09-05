import { Database } from '@/shared/types/database.types';

export type DbTaskRow = Database['public']['Tables']['tasks']['Row'];

export type DbTask = DbTaskRow & {
  subtasks?: DbTask[];
};

export type DbTaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type DbTaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type TaskForSubtaskGeneration = Pick<DbTask, 'id' | 'user_id' | 'title'>;
