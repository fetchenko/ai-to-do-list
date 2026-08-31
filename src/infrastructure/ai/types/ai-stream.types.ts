import type { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import type { PendingToolCall } from '@/infrastructure/ai/tools/tool-call.types';

export type AiStreamEvent =
  | {
      type: 'tool_call';
      toolCall: PendingToolCall;
    }
  | {
      type: 'done';
      metadata: AiGenerationMetadata;
    };
