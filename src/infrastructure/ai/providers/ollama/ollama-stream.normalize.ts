import { normalizeOllamaMetadata } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import {
  OllamaStreamChunk,
  ollamaStreamChunkSchema,
} from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiTool } from '@/infrastructure/ai/types/ai-tool.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import {
  AiGenerationError,
  AiInvalidResponseFormat,
} from '@/shared/errors/ai-app-error';
import { readJsonStream } from '@/shared/streams/read-json-stream';

function parseOllamaStreamChunk(rawChunk: unknown): OllamaStreamChunk {
  const result = ollamaStreamChunkSchema.safeParse(rawChunk);
  if (!result.success) {
    throw new AiInvalidResponseFormat('Ollama returned an invalid stream chunk');
  }
  return result.data;
}

export async function* normalizeOllamaStream(
  body: ReadableStream<Uint8Array>,
  tool: AiTool
): AsyncIterable<AiStreamEvent> {
  const generatedItems: Record<string, unknown>[] = [];
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
          response: JSON.stringify(generatedItems),
        }),
      };
      return;
    }

    for (const toolCall of chunk.message?.tool_calls ?? []) {
      const event = parseToolCall(
        {
          index: toolCall.function.index ?? 0,
          id: toolCall.id ?? '',
          name: toolCall.function.name,
          arguments: JSON.stringify(toolCall.function.arguments),
        },
        tool
      );
      if (event.type === 'event') generatedItems.push(event.data);
      yield event;
    }
  }

  if (!streamCompleted) {
    throw new AiInvalidResponseFormat('Ollama stream ended unexpectedly');
  }
}
