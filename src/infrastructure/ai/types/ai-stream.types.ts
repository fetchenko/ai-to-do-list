import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { ApiEventError } from '@/shared/errors/api-error.schema';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

export type AiStreamEvent =
  | {
      type: 'subtask';
      subtask: SubtaskResponse;
    }
  | {
      type: 'done';
      metadata: AiGenerationMetadata;
    }
  | {
      type: 'error';
      error: ApiEventError;
    };
