import { normalizeDeepseekUsage } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import {
  DeepSeekStreamChunk,
  deepSeekStreamChunkSchema,
} from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';
import { AiToolCallAccumulatorResult } from '@/infrastructure/ai/types/ai-tool.types';
import { AiTool } from '@/shared/types/ai-generation.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

const DEEPSEEK_STREAM_FINISHED = '[DONE]';

function parseDeepSeekStreamChunk(rawChunk: string): DeepSeekStreamChunk {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawChunk);
  } catch {
    throw new AiInvalidResponseFormat('DeepSeek returned invalid JSON');
  }
  const result = deepSeekStreamChunkSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiInvalidResponseFormat('DeepSeek returned an invalid stream chunk');
  }
  return result.data;
}

function parseCompletedToolCall(
  result: AiToolCallAccumulatorResult,
  tool: AiTool
): AiStreamEvent | null {
  return result.type === 'completed' ? parseToolCall(result.toolCall, tool) : null;
}

export async function* normalizeDeepSeekStream(
  body: ReadableStream<Uint8Array>,
  tool: AiTool
): AsyncIterable<AiStreamEvent> {
  const accumulator = new ToolCallAccumulator();
  const generatedItems: Record<string, unknown>[] = [];
  let streamCompleted = false;

  for await (const rawChunk of readSseStream(body)) {
    if (rawChunk === DEEPSEEK_STREAM_FINISHED) {
      streamCompleted = true;
      break;
    }
    const chunk = parseDeepSeekStreamChunk(rawChunk);
    const choice = chunk.choices[0];
    if (!choice) continue;

    const finishReason = choice.finish_reason;
    if (
      finishReason === 'length' ||
      finishReason === 'content_filter' ||
      finishReason === 'insufficient_system_resource'
    ) {
      throw new AiInvalidResponseFormat(
        `DeepSeek stopped the response because of reason: ${finishReason}`
      );
    }

    for (const delta of choice.delta.tool_calls ?? []) {
      const event = parseCompletedToolCall(accumulator.add(delta), tool);
      if (event) {
        if (event.type === 'event') generatedItems.push(event.data);
        yield event;
      }
    }

    if (finishReason === 'tool_calls') {
      const event = parseCompletedToolCall(accumulator.finish(), tool);
      if (event) {
        if (event.type === 'event') generatedItems.push(event.data);
        yield event;
      }
      streamCompleted = true;
      yield {
        type: 'done',
        metadata: {
          model: chunk.model,
          response: JSON.stringify(generatedItems),
          finishReason,
          usage: normalizeDeepseekUsage(chunk.usage),
        },
      };
    }
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('DeepSeek stream ended unexpectedly');
  }
}
