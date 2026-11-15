import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { ApiEventError } from '@/shared/errors/api-error.schema';

export type AiStreamEvent =
  | {
      type: 'event';
      data: Record<string, unknown>;
    }
  | {
      type: 'done';
      metadata: AiGenerationMetadata;
    }
  | {
      type: 'error';
      error: ApiEventError;
    };

export type AiClientStreamEvent =
  | {
      type: 'event';
      data: Record<string, unknown>;
    }
  | {
      type: 'done';
    }
  | {
      type: 'error' | 'cancelled';
      error: ApiEventError;
    };
