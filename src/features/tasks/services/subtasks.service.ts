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
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

const streamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('subtask'),
    subtask: subtasksResponseSchema.shape.subtasks.element,
  }),
  z.object({ type: z.literal('done') }),
  z.object({
    type: z.literal('error'),
    error: z.object({
      code: z.string(),
      message: z.string(),
      status: z.number(),
      details: z.unknown().optional(),
    }),
  }),
]);

type GenerateSubtasksOptions = {
  onSubtask?: (subtask: AiTask) => void;
};

export async function generateSubtasks(
  taskId: string,
  options?: GenerateSubtasksOptions
): Promise<AiTask[]> {
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

  if (!res.body) {
    throw new AppError(
      ErrorCode.UNKNOWN,
      ErrorHttpStatus[ErrorCode.UNKNOWN],
      'AI stream is unavailable'
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const subtasks: AiTask[] = [];
  let completed = false;

  const processLine = (line: string) => {
    if (!line.trim()) {
      return;
    }

    const parsed = streamEventSchema.safeParse(JSON.parse(line));

    if (!parsed.success) {
      throw new AppError(
        ErrorCode.AI_INVALID_RESPONSE_FORMAT,
        ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
        'Invalid AI stream event'
      );
    }

    if (parsed.data.type === 'subtask') {
      const subtask = {
        ...parsed.data.subtask,
        id: crypto.randomUUID(),
      };

      subtasks.push(subtask);
      options?.onSubtask?.(subtask);
      return;
    }

    if (parsed.data.type === 'error') {
      throw new AppError(
        parsed.data.error.code as (typeof ErrorCode)[keyof typeof ErrorCode],
        parsed.data.error.status,
        parsed.data.error.message,
        parsed.data.error.details
      );
    }

    completed = true;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        processLine(line);
      }
    }

    buffer += decoder.decode();
    processLine(buffer);
  } finally {
    reader.releaseLock();
  }

  if (!completed) {
    throw new AppError(
      ErrorCode.UNKNOWN,
      ErrorHttpStatus[ErrorCode.UNKNOWN],
      'AI stream ended unexpectedly'
    );
  }

  if (!subtasks.length) {
    throw new AppError(
      ErrorCode.AI_EMPTY_RESPONSE,
      ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
      'No meaningful subtasks could be generated.'
    );
  }

  return subtasks;
}

export async function saveSubtasks(
  parentTaskId: string,
  subtasks: TaskInsert[]
) {
  const supabase = createClient();

  const lastPosition = await getLastPosition(parentTaskId);

  let prev = lastPosition ?? null;

  const rows = subtasks.map(({ id, ...subtask }) => {
    const {
      data: parsedSubtask,
      success,
      error,
    } = taskSchema.safeParse(subtask);

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
