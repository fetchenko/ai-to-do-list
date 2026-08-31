import { normalizeOllamaUsage } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import {
  type OllamaStreamChunk,
  ollamaStreamChunkSchema,
  ollamaStreamDoneChunkSchema,
} from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import type { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import {
  AiGenerationError,
  AiInvalidResponseFormat,
} from '@/shared/errors/app-error';
import type { SubtaskResponse } from '@/shared/schema/subtasks.schema';
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

function parseOllamaDoneChunk(chunk: OllamaStreamChunk): OllamaStreamChunk {
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
      const pendingToolCall = {
        index: toolCall.function.index ?? 0,
        id: toolCall.id ?? '',
        name: toolCall.function.name,
        arguments: JSON.stringify(toolCall.function.arguments),
      };

      const subtask = parseToolCall(pendingToolCall);
      generatedSubtasks.push(subtask);

      yield {
        type: 'tool_call',
        toolCall: pendingToolCall,
      };
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
