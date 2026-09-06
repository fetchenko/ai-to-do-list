import { SupabaseClient } from '@supabase/supabase-js';

import {
  mapDbTask,
  mapTaskUpdateToDb,
  taskKeyMap,
} from '@/features/tasks/mappers/tasks.mapper';
import { TaskUpdate } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';
import { DbTaskRow } from '@/shared/types/database.types';

// Derived from taskKeyMap (not hardcoded) so this can't silently drift out
// of sync with what mapDbTask actually reads. Explicit over '*' so a future
// column added to the tasks table doesn't get pulled into every fetch by
// default — it only ships once someone deliberately maps it here too.
const TASK_COLUMNS = Object.keys(taskKeyMap).join(',');

export async function fetchTasks(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('tasks')
    .select<typeof TASK_COLUMNS, DbTaskRow>(TASK_COLUMNS)
    .order('position')
    .is('deleted_at', null);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data.map(mapDbTask);
}

export async function fetchTasksClient() {
  const supabase = createClient();

  return fetchTasks(supabase);
}

export async function updateTask(id: string, newTask: TaskUpdate) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update(mapTaskUpdateToDb(newTask))
    .eq('id', id);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function softDeleteTask(id: string) {
  await updateTask(id, { deletedAt: new Date().toISOString() });
}

export async function restoreTask(id: string) {
  await updateTask(id, { deletedAt: null });
}

export async function getLastPosition(parentTaskId?: string | null) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_last_position', {
    p_parent_id: parentTaskId ?? undefined,
  });

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}
