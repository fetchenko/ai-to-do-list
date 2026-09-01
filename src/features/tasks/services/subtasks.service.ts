import { generateKeyBetween } from 'fractional-indexing';
import z from 'zod';

import { API_ROUTES } from '@/app/config/api-routes';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/tasks.mapper';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { taskSchema } from '@/features/tasks/schema/tasks';
import { AiTask, TaskInsert } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import {
  AiEmptyResponseError,
  AiInvalidResponseFormat,
  AppError,
  ValidationRequestError,
} from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';
import { parseApiError } from '@/shared/errors/parse-api-error';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';
import { readJsonStream } from '@/shared/streams/read-json-stream';
import { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

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
    throw parseApiError(body?.error);
  }

  if (!response.body) {
    throw new AiEmptyResponseError('Response body is missing');
  }

  yield* readJsonStream<SubtaskStreamEvent>(response.body);
}

export async function generateSubtasks(taskId: string): Promise<AiTask[]> {
  const res = await fetch(API_ROUTES.generateSubtasks(taskId), {
    method: 'POST',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new AppError(
      body?.error?.code ?? ErrorCode.UNKNOWN,
      res.status,
      body?.error?.message ?? 'Failed to generate subtasks',
      body?.error?.details
    );
  }

  const { data } = await res.json();
  const { data: parsed, success } = subtasksResponseSchema.safeParse(data);

  if (!success) throw new AiInvalidResponseFormat('Invalid AI response format');
  if (!parsed.subtasks?.length) {
    throw new AiEmptyResponseError(
      'No meaningful subtasks could be generated.'
    );
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
      throw new ValidationRequestError(z.treeifyError(result.error));
    }

    const next = generateKeyBetween(prev, null);
    prev = next;

    return mapTaskInsertToDb({ ...result.data, position: next, parentTaskId });
  });

  const { data, error } = await supabase.from('tasks').insert(rows);
  if (error) throw fromSupabaseError(error);
  return data;
}
