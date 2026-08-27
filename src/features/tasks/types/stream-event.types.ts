import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

/**
 * HTTP streaming protocol consumed by the frontend.
 *
 * `subtask` events contain incremental generated subtasks.
 * `done` indicates successful completion.
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
    };
