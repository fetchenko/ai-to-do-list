import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

export type AiStreamChunk =
  | {
      type: 'subtask';
      subtask: SubtaskResponse;
    }
  | {
      type: 'done';
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'content';
      content: string;
    };
