import { PostgrestError } from '@supabase/supabase-js';

import { mapDbTasks, mapTaskUpdateToDb } from '@/features/tasks/mappers/tasks.mapper';
import { DbTask, TaskUpdate } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function fetchTasks() {
  const supabase = createClient();

  const { data, error } = (await supabase
    .from('tasks')
    .select(
      `
    *,
    subtasks:tasks!parent_task_id(*)
  `
    )
    .order('position')
    .order('position', { referencedTable: 'subtasks', ascending: true })
    .is('parent_task_id', null)
    .is('deleted_at', null)) as {
    data: DbTask[] | null;
    error: PostgrestError | null;
  };

  if (error) {
    throw fromSupabaseError(error);
  }

  return mapDbTasks(data);
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
