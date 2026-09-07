import { normalizeDeepseekUsage } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import {
  DeepSeekStreamChunk,
  deepSeekStreamChunkSchema,
} from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';
import { ToolCallAccumulatorResult } from '@/infrastructure/ai/tools/tool-call.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

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
    throw new AiInvalidResponseFormat(
      'DeepSeek returned an invalid stream chunk'
    );
  }

  return result.data;
}

function parseCompletedToolCall(
  result: ToolCallAccumulatorResult
): AiStreamEvent | null {
  if (result.type !== 'completed') {
    return null;
  }

  return parseToolCall(result.toolCall);
}

export async function* normalizeDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamEvent> {
  const accumulator = new ToolCallAccumulator();
  const generatedSubtasks: SubtaskResponse[] = [];

  let streamCompleted = false;

  for await (const rawChunk of readSseStream(body)) {
    if (rawChunk === DEEPSEEK_STREAM_FINISHED) {
      streamCompleted = true;
      break;
    }

    const chunk = parseDeepSeekStreamChunk(rawChunk);
    const choice = chunk.choices[0];

    if (!choice) {
      continue;
    }

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

    for (const toolCall of choice.delta.tool_calls ?? []) {
      const parsedToolCall = parseCompletedToolCall(accumulator.add(toolCall));

      if (!parsedToolCall) {
        continue;
      }

      if (parsedToolCall.type === 'subtask') {
        generatedSubtasks.push(parsedToolCall.subtask);
      }

      yield parsedToolCall;
    }

    if (finishReason === 'tool_calls') {
      const parsedToolCall = parseCompletedToolCall(accumulator.finish());

      if (parsedToolCall) {
        if (parsedToolCall.type === 'subtask') {
          generatedSubtasks.push(parsedToolCall.subtask);
        }

        yield parsedToolCall;
      }

      streamCompleted = true;

      yield {
        type: 'done',
        metadata: {
          model: chunk.model,
          response: JSON.stringify(generatedSubtasks),
          finishReason: choice.finish_reason,
          usage: normalizeDeepseekUsage(chunk.usage),
        },
      };
    }
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('DeepSeek stream ended unexpectedly');
  }
}
