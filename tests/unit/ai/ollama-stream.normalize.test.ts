import { describe, expect, it } from 'vitest';

import { normalizeOllamaStream } from '@/infrastructure/ai/providers/ollama/ollama-stream.normalize';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

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
    message: {
      role: 'assistant',
    },
    ...overrides,
  };
}

describe('normalizeOllamaStream', () => {
  it('normalizes a valid tool call stream', async () => {
    const toolCallChunk = ollamaChunk({
      message: {
        role: 'assistant',
        tool_calls: [
          {
            id: 'call-0',
            function: {
              index: 0,
              name: 'create_subtask',
              arguments: {
                title: 'First',
                description: 'Do first',
              },
            },
          },
        ],
      },
    });

    const doneChunk = ollamaChunk({
      done: true,
      done_reason: 'stop',
      total_duration: 1_000_000,
      prompt_eval_count: 1,
      eval_count: 2,
    });

    const events: unknown[] = [];

    for await (const event of normalizeOllamaStream(
      createStream([toolCallChunk, doneChunk])
    )) {
      events.push(event);
    }

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      type: 'subtask',
      subtask: {
        title: 'First',
        description: 'Do first',
      },
    });
    expect(events[1]).toMatchObject({
      type: 'done',
      metadata: {
        model: 'qwen3:8b',
        finishReason: 'stop',
      },
    });
  });

  it('rejects a chunk that does not match the schema', async () => {
    const invalidChunk = ollamaChunk({
      done: 'true',
    });

    await expect(
      collect(normalizeOllamaStream(createStream([invalidChunk])))
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('rejects malformed JSON', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{invalid-json}\n'));
        controller.close();
      },
    });

    await expect(
      collect(normalizeOllamaStream(stream))
    ).rejects.toThrow();
  });
});

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const item of iterable) {
    result.push(item);
  }

  return result;
}
