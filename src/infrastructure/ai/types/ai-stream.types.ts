import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';

export type AIProviderStreamEvent =
  | {
      type: 'content';
      content: string;
    }
  | {
      type: 'complete';
      response: CombinedAiResponse;
    };

export type AiSubtaskStreamEvent =
  | {
      type: 'subtask';
      subtask: {
        title: string;
        description?: string;
      };
    }
  | {
      type: 'done';
    }
  | {
      type: 'error';
      error: {
        code: string;
        message: string;
        status: number;
        details?: unknown;
      };
    };
