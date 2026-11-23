import { generateKeyBetween } from 'fractional-indexing';

import { API_ROUTES } from '@/app/config/api-routes';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/map-task-to-db';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { taskSchema } from '@/features/tasks/schema/tasks';
import { SubtaskStreamEvent } from '@/features/tasks/types/subtask-stream-event.types';
import { subtasksResponseSchema } from '@/features/tasks/types/subtasks.schema';
import {
  AiGeneratedTask,
  TaskInsert,
} from '@/features/tasks/types/tasks.types';
import { ClientError } from '@/client/errors/client-error';
import { fromSupabaseError } from '@/client/errors/from-supabase-error';
import { parseApiError } from '@/client/errors/parse-api-error';
import { createClient } from '@/infrastructure/supabase/client';
import { ErrorCode } from '@/shared/errors/code';
import { readJsonStream } from '@/shared/streams/read-json-stream';

export async function* streamSubtasks(
  taskId: string,
  signal?: AbortSignal
): AsyncGenerator<SubtaskStreamEvent> {
  const response = await fetch(API_ROUTES.streamSubtasks(taskId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw parseApiError(body?.error, response.status);
  }

  if (!response.body) {
    throw new ClientError(ErrorCode.AI_EMPTY_RESPONSE);
  }

  yield* readJsonStream<SubtaskStreamEvent>(response.body);
}

export async function generateSubtasks(
  taskId: string
): Promise<AiGeneratedTask[]> {
  const res = await fetch(API_ROUTES.generateSubtasks(taskId), {
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);

    throw parseApiError(body?.error, res.status);
  }

  const { data } = await res.json();
  const { data: parsed, success } = subtasksResponseSchema.safeParse(data);

  if (!success) throw new ClientError(ErrorCode.AI_INVALID_RESPONSE_FORMAT);
  if (!parsed.subtasks?.length) {
    throw new ClientError(ErrorCode.AI_EMPTY_RESPONSE);
  }

  return parsed.subtasks.map((subtask) => ({
    ...subtask,
    id: crypto.randomUUID(),
  }));
}

export async function saveSubtasks(
  parentTaskId: string,
  subtasks: TaskInsert[]
) {
  const supabase = createClient();
  const lastPosition = await getLastPosition(parentTaskId);
  let prev = lastPosition ?? null;

  const rows = subtasks.map(({ id, ...subtask }) => {
    const result = taskSchema.safeParse(subtask);
    if (!result.success) {
      throw new ClientError(ErrorCode.INVALID_REQUEST);
    }

    const next = generateKeyBetween(prev, null);
    prev = next;

    return mapTaskInsertToDb({ ...result.data, position: next, parentTaskId });
  });

  const { data, error } = await supabase.from('tasks').insert(rows);
  if (error) throw fromSupabaseError(error);
  return data;
}
