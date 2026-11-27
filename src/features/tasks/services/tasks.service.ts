import { generateKeyBetween } from 'fractional-indexing';

import { mapDbTask } from '@/features/tasks/mappers/map-db-task';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/map-task-to-db';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { Task, TaskInsert } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { ClientError } from '@/client/errors/client-error';
import { fromSupabaseError } from '@/infrastructure/supabase/errors/from-supabase-error';

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
    const mappedError = fromSupabaseError(error);
    throw new ClientError(mappedError.code, mappedError.message, { cause: error });
  }

  return mapDbTask(data);
}
