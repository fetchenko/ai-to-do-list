import { ApiEventError } from '@/shared/errors/api-error.schema';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

/**
 * HTTP streaming protocol consumed by the frontend.
 *
 * `subtask` events contain incremental generated subtasks.
 * `done` indicates successful completion.
 * `error` indicates generation failure and is followed by
 * stream completion.
 * `cancelled` indicates abort error
 *
 * Provider-specific errors and metadata are never exposed.
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
      error: ApiEventError;
    }
  | {
      type: 'cancelled';
      error: ApiEventError;
    };
