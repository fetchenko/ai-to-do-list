import { generateKeyBetween } from 'fractional-indexing';

import { mapDbTask } from '@/features/tasks/mappers/map-db-task';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/map-task-to-db';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { Task, TaskInsert } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function addTask(newTask: TaskInsert): Promise<Task> {
  const supabase = createClient();

  const lastPosition = await getLastPosition(newTask.parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const { data, error } = await supabase
    .from('tasks')
    .insert(mapTaskInsertToDb({ ...newTask, position: newPosition }))
    .select()
    .single();

  if (error) {
    throw fromSupabaseError(error);
  }

  return mapDbTask(data);
}
