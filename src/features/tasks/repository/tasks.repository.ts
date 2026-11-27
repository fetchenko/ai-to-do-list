import { SupabaseClient } from '@supabase/supabase-js';

import {
  runClientSupabaseQuery,
  toClientSupabaseError,
} from '@/client/errors/from-supabase-error';
import { mapDbTask } from '@/features/tasks/mappers/map-db-task';
import {
  mapTaskUpdateToDb,
  taskKeyMap,
} from '@/features/tasks/mappers/map-task-to-db';
import { TaskUpdate } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { DbTaskRow } from '@/infrastructure/supabase/types/database-task.types';

const TASK_COLUMNS = Object.keys(taskKeyMap).join(',');

/**
 * Accepts either a server or admin Supabase client, allowing the caller
 * to determine the authentication/authorization context.
 *
 * The raw Supabase error is propagated so the caller can translate it
 * for its execution boundary (server or client).
 */
export async function fetchTasks(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('tasks')
    .select<typeof TASK_COLUMNS, DbTaskRow>(TASK_COLUMNS)
    .order('position')
    .is('deleted_at', null);

  if (error) throw error;

  return data.map(mapDbTask);
}

export async function fetchTasksClient() {
  const supabase = createClient();

  try {
    return await fetchTasks(supabase);
  } catch (error) {
    throw toClientSupabaseError(error);
  }
}

export async function updateTask(id: string, newTask: TaskUpdate) {
  const supabase = createClient();

  return runClientSupabaseQuery(
    supabase
      .from('tasks')
      .update(mapTaskUpdateToDb(newTask))
      .eq('id', id)
  );
}

export async function softDeleteTask(id: string) {
  await updateTask(id, { deletedAt: new Date().toISOString() });
}

export async function restoreTask(id: string) {
  await updateTask(id, { deletedAt: null });
}

export async function getLastPosition(parentTaskId?: string | null) {
  const supabase = createClient();

  return runClientSupabaseQuery(
    supabase.rpc('get_last_position', {
      p_parent_id: parentTaskId ?? undefined,
    })
  );
}
