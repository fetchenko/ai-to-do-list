import { generateKeyBetween } from 'fractional-indexing';

import { mapTaskInsertToDb } from '@/features/tasks/mappers/tasks.mapper';
import { fetchTasks, getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { TaskInsert } from '@/features/tasks/types/tasks.types';
import { filterDeletedSubtasks } from '@/features/tasks/utils/tasks';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function addTask(newTask: TaskInsert) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(newTask.parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const { data, error } = await supabase
    .from('tasks')
    .insert(mapTaskInsertToDb({ ...newTask, position: newPosition }));

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}

export async function getUserTasks() {
  const tasks = await fetchTasks();

  return filterDeletedSubtasks(tasks);
}
