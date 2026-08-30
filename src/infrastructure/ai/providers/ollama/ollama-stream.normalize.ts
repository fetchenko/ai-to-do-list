import { normalizeOllamaUsage } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import {
  ollamaStreamChunkSchema,
  ollamaStreamDoneChunkSchema,
  OllamaStreamChunk,
} from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readJsonStream } from '@/infrastructure/ai/utils/read-json-stream.utils';
import {
  AiGenerationError,
  AiInvalidResponseFormat,
} from '@/shared/errors/app-error';
import { SubtaskResponse } from '@/shared/schema/subtasks.schema';

function parseOllamaStreamChunk(rawChunk: unknown): OllamaStreamChunk {
  const result = ollamaStreamChunkSchema.safeParse(rawChunk);

  if (!result.success) {
    throw new AiInvalidResponseFormat(
      'Ollama returned an invalid stream chunk'
    );
  }

  return result.data;
}

function parseOllamaDoneChunk(
  chunk: OllamaStreamChunk
): OllamaStreamChunk {
  const result = ollamaStreamDoneChunkSchema.safeParse(chunk);

  if (!result.success) {
    throw new AiInvalidResponseFormat(
      'Ollama returned an invalid completion chunk'
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

    if (chunk.error) {
      throw new AiGenerationError(`Ollama stream error: ${chunk.error}`);
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

    if (chunk.done) {
      const doneChunk = parseOllamaDoneChunk(chunk);
      streamCompleted = true;

      yield {
        type: 'done',
        metadata: {
          model: doneChunk.model,
          response: JSON.stringify(generatedSubtasks),
          finishReason: doneChunk.done_reason,
          usage: normalizeOllamaUsage(doneChunk),
        },
      };
    }
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('Ollama stream ended unexpectedly');
  }
}
