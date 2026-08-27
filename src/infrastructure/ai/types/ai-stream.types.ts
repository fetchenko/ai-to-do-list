import { AiLogs } from '@/infrastructure/ai/types/ai.types';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

export type AiStreamEvent =
  | {
      type: 'subtask';
      subtask: SubtaskResponse;
    }
  | {
      type: 'done';
      metadata: AiLogs;
    }
  | {
      type: 'error';
      message: string;
    }
  | {
      type: 'content';
      content: string;
    };
