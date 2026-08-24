import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

export type ToolCallDelta = {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type PendingToolCall = {
  index: number;
  id: string;
  name: string;
  arguments: string;
};

export type ToolCallAccumulatorResult =
  | {
      type: 'accumulating';
    }
  | {
      type: 'completed';
      toolCall: PendingToolCall;
    };

export class ToolCallAccumulator {
  private current: PendingToolCall | null = null;

  add(delta: ToolCallDelta): ToolCallAccumulatorResult {
    if (!this.current) {
      this.current = createToolCall(delta);

      return { type: 'accumulating' };
    }

    if (delta.index < this.current.index) {
      throw new AiInvalidResponseFormat(
        'DeepSeek returned tool calls out of order'
      );
    }

    if (delta.index !== this.current.index) {
      const completedToolCall = this.current;

      this.current = createToolCall(delta);

      return {
        type: 'completed',
        toolCall: completedToolCall,
      };
    }

    this.current = appendToolCall(this.current, delta);

    return { type: 'accumulating' };
  }

  finish(): ToolCallAccumulatorResult {
    if (!this.current) {
      return { type: 'accumulating' };
    }

    const completedToolCall = this.current;

    this.current = null;

    return {
      type: 'completed',
      toolCall: completedToolCall,
    };
  }
}

function createToolCall(delta: ToolCallDelta): PendingToolCall {
  return {
    index: delta.index,
    id: delta.id ?? '',
    name: delta.function?.name ?? '',
    arguments: delta.function?.arguments ?? '',
  };
}

function appendToolCall(
  current: PendingToolCall,
  delta: ToolCallDelta
): PendingToolCall {
  return {
    ...current,
    id: delta.id ?? current.id,
    name: delta.function?.name ?? current.name,
    arguments: current.arguments + (delta.function?.arguments ?? ''),
  };
}
