import { generateKeyBetween } from 'fractional-indexing';
import z from 'zod';

import { API_ROUTES } from '@/app/config/api-routes';
import { mapTaskInsertToDb } from '@/features/tasks/mappers/tasks.mapper';
import { getLastPosition } from '@/features/tasks/repository/tasks.repository';
import { taskSchema } from '@/features/tasks/schema/tasks';
import { AiTask, TaskInsert } from '@/features/tasks/types/tasks.types';
import { createClient } from '@/infrastructure/supabase/client';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import { subtasksResponseSchema } from '@/shared/validation/subtasks.validation';

export async function generateSubtasks(taskId: string): Promise<AiTask[]> {
  const res = await fetch(API_ROUTES.generateSubtasks, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new AppError(
      body?.error?.code ?? ErrorCode.UNKNOWN,
      res.status,
      body?.error?.message ?? 'Failed to generate subtasks',
      body?.error?.details,
      body?.error?.retryable
    );
  }

  const { data } = await res.json();

  const { data: parsed, success } = subtasksResponseSchema.safeParse(data);

  if (!success) {
    throw new AppError(
      ErrorCode.AI_INVALID_RESPONSE_FORMAT,
      ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
      'Invalid AI response format'
    );
  }
  if (!parsed.subtasks?.length) {
    throw new AppError(
      ErrorCode.AI_EMPTY_RESPONSE,
      ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
      'No meaningful subtasks could be generated.'
    );
  }

  const subtasks = parsed.subtasks.map((subtask) => ({
    ...subtask,
    id: crypto.randomUUID(),
  }));

  return subtasks;
}

export async function saveSubtasks(parentTaskId: string, subtasks: TaskInsert[]) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  let prev = lastPosition ?? null;

  const rows = subtasks.map(({ id, ...subtask }) => {
    const { data: parsedSubtask, success, error } = taskSchema.safeParse(subtask);

    if (!success) {
      throw new AppError(
        ErrorCode.INVALID_REQUEST,
        ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
        'Each subtask must have a valid title',
        z.treeifyError(error)
      );
    }

    const next = generateKeyBetween(prev, null);
    prev = next;

    return mapTaskInsertToDb({
      ...parsedSubtask,
      position: next,
      parentTaskId,
    });
  });

  const { data, error } = await supabase.from('tasks').insert(rows);

  if (error) {
    throw fromSupabaseError(error);
  }

  return data;
}
