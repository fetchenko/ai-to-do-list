import type { ApiError } from '@/shared/errors/api-error.schema';
import type { SubtaskResponse } from '@/shared/schema/subtasks.schema';

/**
 * HTTP streaming protocol consumed by the frontend.
 *
 * `subtask` events contain incremental generated subtasks.
 * `done` indicates successful completion.
 * `error` indicates generation failure and is followed by
 * stream completion.
 */
export type SubtaskStreamEvent =
  | {
      type: 'subtask';
      subtask: SubtaskResponse;
    }
  | {
      type: 'done';
    }
  | {
      type: 'error';
      error: ApiError & { success: false };
    };
