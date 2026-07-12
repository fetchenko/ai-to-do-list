import { SupabaseClient } from '@supabase/supabase-js';

import {
  mapDbTask,
  mapTaskUpdateToDb,
} from '@/features/tasks/mappers/tasks.mapper';
import { TaskUpdate } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function fetchTasks(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
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

export async function moveTask(taskId: string, newPosition: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tasks')
    .update(
      mapTaskUpdateToDb({
        position: newPosition,
      })
    )
    .eq('id', taskId);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}
