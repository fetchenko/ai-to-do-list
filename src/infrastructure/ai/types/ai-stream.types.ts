import type { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import type { PendingToolCall } from '@/infrastructure/ai/tools/tool-call.types';
import type { AiErrorResult } from '@/shared/errors/ai-error.types';

export type AiStreamEvent =
  | {
      type: 'tool_call';
      toolCall: PendingToolCall;
    }
  | {
      type: 'done';
      metadata: AiGenerationMetadata;
    }
  | {
      type: 'error';
      error: AiErrorResult;
    };
