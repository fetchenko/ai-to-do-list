import { collect } from '@tests/utils/collect';
import { describe, expect, it } from 'vitest';

import { normalizeOllamaStream } from '@/infrastructure/ai/providers/ollama/ollama-stream.normalize';
import { AiGenerationError, AiInvalidResponseFormat } from '@/shared/errors/app-error';

function createStream(chunks: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(chunks.map((chunk) => `${JSON.stringify(chunk)}\n`).join(''))
      );
      controller.close();
    },
  });
}

function ollamaChunk(overrides: Record<string, unknown> = {}) {
  return {
    model: 'qwen3:8b',
    created_at: '2026-08-30T00:00:00Z',
    done: false,
    message: { role: 'assistant' },
    ...overrides,
  };
}

describe('normalizeOllamaStream', () => {
  it('normalizes a tool call and completion', async () => {
    const stream = createStream([
      ollamaChunk({
        message: {
          role: 'assistant',
          tool_calls: [
            {
              id: 'call-0',
              function: {
                index: 0,
                name: 'create_subtask',
                arguments: { title: 'First', description: 'Do first' },
              },
            },
          ],
        },
      }),
      ollamaChunk({
        done: true,
        done_reason: 'stop',
        prompt_eval_count: 1,
        eval_count: 2,
      }),
    ]);

    await expect(collect(normalizeOllamaStream(stream))).resolves.toEqual([
      {
        type: 'subtask',
        subtask: { title: 'First', description: 'Do first' },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response: '[{"title":"First","description":"Do first"}]',
          finishReason: 'stop',
        }),
      },
    ]);
  });

  it('normalizes streamed content into completion metadata', async () => {
    const stream = createStream([
      ollamaChunk({ message: { role: 'assistant', content: 'Hello' } }),
      ollamaChunk({ message: { role: 'assistant', content: ' world' } }),
      ollamaChunk({
        done: true,
        done_reason: 'stop',
        prompt_eval_count: 1,
        eval_count: 2,
      }),
    ]);

    await expect(collect(normalizeOllamaStream(stream))).resolves.toEqual([
      { type: 'done', metadata: expect.objectContaining({ response: '[]' }) },
    ]);
  });

  it('throws an AI generation error when Ollama reports a stream error', async () => {
    const stream = createStream([
      { error: 'model is unavailable', model: 'qwen3', done: false },
    ]);

    await expect(collect(normalizeOllamaStream(stream))).rejects.toEqual(
      new AiGenerationError('Ollama stream error: model is unavailable')
    );
  });

  it('rejects malformed JSON', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{invalid-json}\n'));
        controller.close();
      },
    });

    await expect(collect(normalizeOllamaStream(stream))).rejects.toThrow();
  });

  it('rejects a chunk that does not match the schema', async () => {
    await expect(
      collect(normalizeOllamaStream(createStream([ollamaChunk({ done: 'true' })])))
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('throws when the stream ends without a completion chunk', async () => {
    const stream = createStream([
      ollamaChunk({ message: { role: 'assistant', content: 'partial' } }),
    ]);

    await expect(collect(normalizeOllamaStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat('Ollama stream ended unexpectedly')
    );
  });
});
