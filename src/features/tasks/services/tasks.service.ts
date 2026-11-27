import { generateKeyBetween } from 'fractional-indexing';

import { runClientSupabaseQuery } from '@/client/errors/from-supabase-error';
import { mapDbTask } from '@/features/tasks/mappers/map-db-task';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/map-task-to-db';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { Task, TaskInsert } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';

export async function addTask(newTask: TaskInsert): Promise<Task> {
  const supabase = createClient();

  const lastPosition = await getLastPosition(newTask.parentTaskId);

  const newPosition = generateKeyBetween(lastPosition ?? null, null);

  const data = await runClientSupabaseQuery(
    supabase
      .from('tasks')
      .insert(mapTaskInsertToDb({ ...newTask, position: newPosition }))
      .select()
      .single()
  );

  return mapDbTask(data);
}
