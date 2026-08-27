import { normalizeOllamaUsage } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import { OllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readJsonStream } from '@/infrastructure/ai/utils/read-json-stream.utils';

type OllamaStreamChunk = {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content?: string;
    tool_calls?: Array<{
      id?: string;
      function: {
        index?: number;
        name: string;
        arguments: Record<string, unknown>;
      };
    }>;
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
};

export async function* normalizeOllamaStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamEvent> {
  const generatedSubtasks = [];

  for await (const rawChunk of readJsonStream(body)) {
    const chunk = rawChunk as OllamaStreamChunk;

    const message = chunk.message;

    if (message?.content) {
      yield {
        type: 'content',
        content: message.content,
      };
    }

    for (const toolCall of message?.tool_calls ?? []) {
      const parsedToolCall = parseToolCall({
        index: toolCall.function.index ?? 0,
        id: toolCall.id ?? '',
        name: toolCall.function.name,
        arguments: JSON.stringify(toolCall.function.arguments),
      });

      if (parsedToolCall.type === 'subtask') {
        generatedSubtasks.push(parsedToolCall.subtask);
      }

      yield parsedToolCall;
    }

    if (chunk.done) {
      const metadata = chunk as OllamaResponse;

      yield {
        type: 'done',
        metadata: {
          model: metadata.model,
          response: JSON.stringify(generatedSubtasks),
          usage: normalizeOllamaUsage(metadata),
        },
      };

      return;
    }
  }
}
