import {
  AiToolCall,
  AiToolCallAccumulatorResult,
  AiToolCallDelta,
} from '@/infrastructure/ai/types/ai-tool.types';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

/**
 * Accumulates streamed tool-call deltas.
 *
 * This currently supports the sequential tool-call delta behavior used by
 * DeepSeek's streaming API. Provider-specific guarantees should remain
 * documented and tested in the corresponding adapter.
 */
export class ToolCallAccumulator {
  private current: AiToolCall | null = null;

  add(delta: AiToolCallDelta): AiToolCallAccumulatorResult {
    if (!this.current) {
      this.current = createToolCall(delta);
      return { type: 'accumulating' };
    }

    if (delta.index < this.current.index) {
      throw new AiInvalidResponseFormat('AI returned tool calls out of order');
    }

    if (delta.index !== this.current.index) {
      const completedToolCall = this.current;
      this.current = createToolCall(delta);
      return { type: 'completed', toolCall: completedToolCall };
    }

    this.current = appendToolCall(this.current, delta);
    return { type: 'accumulating' };
  }

  finish(): AiToolCallAccumulatorResult {
    if (!this.current) return { type: 'accumulating' };

    const completedToolCall = this.current;
    this.current = null;
    return { type: 'completed', toolCall: completedToolCall };
  }
}

function createToolCall(delta: AiToolCallDelta): AiToolCall {
  return {
    index: delta.index,
    id: delta.id ?? '',
    name: delta.function?.name ?? '',
    arguments: delta.function?.arguments ?? '',
  };
}

function appendToolCall(
  current: AiToolCall,
  delta: AiToolCallDelta
): AiToolCall {
  return {
    ...current,
    id: delta.id ?? current.id,
    name: delta.function?.name ?? current.name,
    arguments: current.arguments + (delta.function?.arguments ?? ''),
  };
}
