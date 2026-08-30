import { normalizeDeepseekUsage } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import {
  deepSeekStreamChunkSchema,
  DeepSeekStreamChunk,
} from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';
import { ToolCallAccumulatorResult } from '@/infrastructure/ai/tools/tool-call.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream.utils';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';
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
  result: ToolCallAccumulatorResult,
  generatedSubtasks: SubtaskResponse[]
): AiStreamEvent | null {
  if (result.type !== 'completed') {
    return null;
  }

  const parsedToolCall = parseToolCall(result.toolCall);

  if (parsedToolCall.type === 'subtask') {
    generatedSubtasks.push(parsedToolCall.subtask);
  }

  return parsedToolCall;
}

export async function* normalizeDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamEvent> {
  const accumulator = new ToolCallAccumulator();
  const generatedSubtasks: SubtaskResponse[] = [];

  let streamCompleted = false;

  for await (const chunk of readSseStream(body)) {
    if (chunk === DEEPSEEK_STREAM_FINISHED) {
      streamCompleted = true;
      break;
    }

    const parsedChunk = parseDeepSeekStreamChunk(chunk);
    const choice = parsedChunk.choices[0];

    if (!choice) {
      continue;
    }

    for (const toolCall of choice.delta.tool_calls ?? []) {
      const result = accumulator.add(toolCall);
      const parsedToolCall = parseCompletedToolCall(
        result,
        generatedSubtasks
      );

      if (parsedToolCall) {
        yield parsedToolCall;
      }
    }

    if (choice.finish_reason === 'length') {
      throw new AiInvalidResponseFormat(
        'DeepSeek response was truncated before completing tool calls'
      );
    }

    if (choice.finish_reason === 'content_filter') {
      throw new AiInvalidResponseFormat(
        'DeepSeek stopped the response because of its content filter'
      );
    }

    if (choice.finish_reason === 'insufficient_system_resource') {
      throw new AiInvalidResponseFormat(
        'DeepSeek stopped the response because of insufficient system resources'
      );
    }

    if (choice.finish_reason === 'tool_calls') {
      const result = accumulator.finish();
      const parsedToolCall = parseCompletedToolCall(
        result,
        generatedSubtasks
      );

      if (parsedToolCall) {
        yield parsedToolCall;
      }

      streamCompleted = true;

      yield {
        type: 'done',
        metadata: {
          model: parsedChunk.model,
          response: JSON.stringify(generatedSubtasks),
          finishReason: choice.finish_reason,
          usage: normalizeDeepseekUsage(parsedChunk.usage),
        },
      };
    }
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('DeepSeek stream ended unexpectedly');
  }
}
