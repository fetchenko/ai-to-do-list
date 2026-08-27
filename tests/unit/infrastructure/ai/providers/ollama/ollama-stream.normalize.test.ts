import { describe, expect, it } from 'vitest';

import { normalizeOllamaStream } from '@/infrastructure/ai/providers/ollama/ollama-stream.normalize';

function createStream(chunks: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
      }

      controller.close();
    },
  });
}

async function collectStream(stream: AsyncIterable<unknown>): Promise<unknown[]> {
  const result = [];

  for await (const chunk of stream) {
    result.push(chunk);
  }

  return result;
}

describe('normalizeOllamaStream', () => {
  it('normalizes a tool call and completion', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.045569102Z',
        message: {
          role: 'assistant',
          content: '',
          tool_calls: [{
            id: 'call_mmcwou63',
            function: {
              index: 0,
              name: 'create_subtask',
              arguments: {
                title: 'Buy groceries',
                description: 'Buy groceries from the store',
              },
            },
          }],
        },
        done: false,
      },
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.228512695Z',
        message: { role: 'assistant', content: '' },
        done: true,
        done_reason: 'stop',
        prompt_eval_count: 143,
        eval_count: 22,
      },
    ]);

    const result = await collectStream(normalizeOllamaStream(body));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'Buy groceries',
          description: 'Buy groceries from the store',
        },
      },
      {
        type: 'done',
        metadata: {
          model: 'qwen3:8b',
          response: '[{"title":"Buy groceries","description":"Buy groceries from the store"}]',
          usage: {
            input_tokens: 143,
            output_tokens: 22,
            total_tokens: 165,
            finish_reason: 'stop',
            reasoning_tokens: 0,
            cache_hit_tokens: 0,
            cache_miss_tokens: 0,
            duration_ms: null,
          },
        },
      },
    ]);
  });

  it('normalizes streamed content and completion metadata', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.045569102Z',
        message: { role: 'assistant', content: 'Hello' },
        done: false,
      },
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.228512695Z',
        message: { role: 'assistant', content: ' world' },
        done: false,
      },
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.228512695Z',
        message: { role: 'assistant', content: '' },
        done: true,
        done_reason: 'stop',
        usage: {
          prompt_tokens: 514,
          completion_tokens: 451,
          total_tokens: 965,
          prompt_tokens_details: { cached_tokens: 512 },
          completion_tokens_details: { reasoning_tokens: 73 },
          prompt_cache_hit_tokens: 512,
          prompt_cache_miss_tokens: 2,
        },
      },
    ]);

    const result = await collectStream(normalizeOllamaStream(body));

    expect(result).toEqual([
      { type: 'content', content: 'Hello' },
      { type: 'content', content: ' world' },
      {
        type: 'done',
        metadata: {
          model: 'qwen3:8b',
          response: '[]',
          usage: {
            input_tokens: 514,
            output_tokens: 451,
            total_tokens: 965,
            finish_reason: 'stop',
            reasoning_tokens: 0,
            cache_hit_tokens: 0,
            cache_miss_tokens: 0,
            duration_ms: null,
          },
        },
      },
    ]);
  });

  it('emits a completion for an empty result', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.045569102Z',
        message: { role: 'assistant', content: '' },
        done: false,
      },
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.228512695Z',
        message: { role: 'assistant', content: '' },
        done: true,
        done_reason: 'stop',
      },
    ]);

    const result = await collectStream(normalizeOllamaStream(body));

    expect(result).toEqual([
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response: '[]',
        }),
      },
    ]);
  });

  it('handles a response without a message', async () => {
    const body = createStream([
      {
        model: 'qwen3:8b',
        created_at: '2026-08-25T11:51:01.228512695Z',
        done: true,
        done_reason: 'stop',
      },
    ]);

    const result = await collectStream(normalizeOllamaStream(body));

    expect(result).toEqual([
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response: '[]',
        }),
      },
    ]);
  });
});
