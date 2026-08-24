import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { ToolCallAccumulator } from '@/infrastructure/ai/tools/tool-call-accumulator';
import { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream.utils';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

export async function* normilizeDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamChunk> {
  const accumulator = new ToolCallAccumulator();

  for await (const chunk of readSseStream(body)) {
    const result = JSON.parse(chunk);
    const choice = result.choices?.[0];

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
        yield parseToolCall(result.toolCall);
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
        yield parseToolCall(result.toolCall);
      }

      yield { type: 'done' };

      return;
    }
  }
}
