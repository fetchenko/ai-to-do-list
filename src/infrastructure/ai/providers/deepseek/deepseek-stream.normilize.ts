import { normalizeDeepseekUsage } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream.utils';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

export async function* normalizeDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamEvent> {
  const accumulator = new ToolCallAccumulator();
  const generatedSubtasks = [];

  for await (const chunk of readSseStream(body)) {
    const parsedChunk = JSON.parse(chunk);
    const choice = parsedChunk.choices?.[0];

    if (!choice) {
      continue;
    }

    const delta = choice.delta;
    const finishReason = choice.finish_reason;

    if (delta?.content) {
      yield {
        type: 'content',
        content: delta.content,
      };
    }

    for (const toolCall of delta?.tool_calls ?? []) {
      const result = accumulator.add(toolCall);

      if (result.type === 'completed') {
        const parsedToolCall = parseToolCall(result.toolCall);
        if (parsedToolCall.type === 'subtask') {
          generatedSubtasks.push(parsedToolCall.subtask);
        }

        yield parsedToolCall;
      }
    }

    if (finishReason === 'length') {
      throw new AiInvalidResponseFormat(
        'DeepSeek response was truncated before completing tool calls'
      );
    }

    if (finishReason === 'tool_calls') {
      const result = accumulator.finish();

      if (result.type === 'completed') {
        const parsedToolCall = parseToolCall(result.toolCall);
        if (parsedToolCall.type === 'subtask') {
          generatedSubtasks.push(parsedToolCall.subtask);
        }

        yield parsedToolCall;
      }

      yield {
        type: 'done',
        metadata: {
          model: parsedChunk.model,
          response: JSON.stringify(generatedSubtasks),
          usage: normalizeDeepseekUsage(parsedChunk),
        },
      };

      return;
    }
  }
}
