import { PendingToolCall } from '@/infrastructure/ai/providers/deepseek/stream/deepseek-stream.types';
import { parseToolCall } from '@/infrastructure/ai/providers/deepseek/stream/parse-tool-call';
import { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';
import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream.utils';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

export async function* normilizeDeepSeekStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamChunk> {
  let currentToolCall: PendingToolCall | null = null;
  let lastToolCallIndex = -1;

  for await (const chunk of readSseStream(body)) {
    const result = JSON.parse(chunk);
    const choice = result.choices?.[0];

    if (!choice) {
      continue;
    }

    const delta = choice.delta;
    const finishReason = choice.finish_reason;

    for (const toolCall of delta?.tool_calls ?? []) {
      const index = toolCall.index;

      if (index < lastToolCallIndex) {
        throw new AiInvalidResponseFormat(
          'DeepSeek returned tool calls out of order'
        );
      }

      if (currentToolCall && index !== currentToolCall.index) {
        yield parseToolCall(currentToolCall);

        lastToolCallIndex = currentToolCall.index;
        currentToolCall = null;
      }

      if (!currentToolCall) {
        currentToolCall = {
          index,
          id: toolCall.id ?? '',
          name: toolCall.function?.name ?? '',
          arguments: toolCall.function?.arguments ?? '',
        };

        continue;
      }

      if (toolCall.id) {
        currentToolCall.id = toolCall.id;
      }

      if (toolCall.function?.name) {
        currentToolCall.name = toolCall.function.name;
      }

      currentToolCall.arguments += toolCall.function?.arguments ?? '';
    }

    if (finishReason === 'length') {
      throw new AiInvalidResponseFormat(
        'DeepSeek response was truncated before completing tool calls'
      );
    }

    if (finishReason === 'tool_calls') {
      if (currentToolCall) {
        yield parseToolCall(currentToolCall);
      }

      yield { type: 'done' };

      return;
    }
  }
}
