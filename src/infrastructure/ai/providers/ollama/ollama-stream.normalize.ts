import { normalizeOllamaMetadata } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import {
  OllamaStreamChunk,
  ollamaStreamChunkSchema,
} from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import {
  AiGenerationError,
  AiInvalidResponseFormat,
} from '@/shared/errors/app-error';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';
import { readJsonStream } from '@/shared/streams/read-json-stream';

function parseOllamaStreamChunk(rawChunk: unknown): OllamaStreamChunk {
  const result = ollamaStreamChunkSchema.safeParse(rawChunk);

  if (!result.success) {
    throw new AiInvalidResponseFormat(
      'Ollama returned an invalid stream chunk'
    );
  }

  return result.data;
}

export async function* normalizeOllamaStream(
  body: ReadableStream<Uint8Array>
): AsyncIterable<AiStreamEvent> {
  const generatedSubtasks: SubtaskResponse[] = [];
  let streamCompleted = false;

  for await (const rawChunk of readJsonStream(body)) {
    const chunk = parseOllamaStreamChunk(rawChunk);

    if ('error' in chunk) {
      throw new AiGenerationError(`Ollama stream error: ${chunk.error}`);
    }

    if (chunk.done) {
      streamCompleted = true;

      yield {
        type: 'done',
        metadata: normalizeOllamaMetadata({
          ...chunk,
          response: JSON.stringify(generatedSubtasks),
        }),
      };

      return;
    }

    for (const toolCall of chunk.message?.tool_calls ?? []) {
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
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('Ollama stream ended unexpectedly');
  }
}
