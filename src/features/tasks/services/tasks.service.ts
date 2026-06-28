import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';
import { generateKeyBetween } from 'fractional-indexing';

import { mapTaskInsertToDb } from '../mappers/tasks.mapper';
import { fetchTasks, getLastPosition } from '../repository/tasks.repository';
import { TaskInsert } from '../types/tasks.types';
import { filterDeletedSubtasks } from '../utils/tasks';

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
