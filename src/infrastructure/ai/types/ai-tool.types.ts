import { AiTool } from '@/shared/types/ai-generation.types';

export type { AiTool };

export type AiToolCall = {
  index: number;
  id: string;
  name: string;
  arguments: string;
};

export type AiToolCallDelta = {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type AiToolCallAccumulatorResult =
  | { type: 'accumulating' }
  | { type: 'completed'; toolCall: AiToolCall };
