import { collect } from '@tests/utils/collect';
import { describe, expect, it } from 'vitest';

import { normalizeDeepSeekStream } from '@/infrastructure/ai/providers/deepseek/deepseek-stream.normalize';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

function createStream(events: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(events.map((event) => `data: ${event}`).join('\n\n'))
      );
      controller.close();
    },
  });
}

function deepSeekChunk(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chunk-1',
    object: 'chat.completion.chunk',
    created: 1,
    model: 'deepseek-v4-flash',
    system_fingerprint: 'fp-1',
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: null,
      },
    ],
    ...overrides,
  };
}

describe('normalizeDeepSeekStream', () => {
  it('normalizes a valid tool call stream', async () => {
    const firstChunk = deepSeekChunk({
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call-0',
                type: 'function',
                function: {
                  name: 'create_subtask',
                  arguments: '{"title":"First","description":"Do first"}',
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    });

    const doneChunk = deepSeekChunk({
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'tool_calls',
        },
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 2,
        total_tokens: 3,
        prompt_cache_hit_tokens: 0,
        prompt_cache_miss_tokens: 1,
      },
    });

    const events: unknown[] = [];

    for await (const event of normalizeDeepSeekStream(
      createStream([
        JSON.stringify(firstChunk),
        JSON.stringify(doneChunk),
        '[DONE]',
      ])
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
        model: 'deepseek-v4-flash',
        finishReason: 'tool_calls',
      },
    });
  });

  it('rejects malformed JSON', async () => {
    await expect(
      collect(normalizeDeepSeekStream(createStream(['not-json'])))
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('rejects a chunk that does not match the schema', async () => {
    const invalidChunk = deepSeekChunk({
      object: 'unexpected.object',
    });

    await expect(
      collect(
        normalizeDeepSeekStream(createStream([JSON.stringify(invalidChunk)]))
      )
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('does not yield a tool call when the following chunk is invalid', async () => {
    const firstChunk = deepSeekChunk({
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call-0',
                type: 'function',
                function: {
                  name: 'create_subtask',
                  arguments: '{"title":"First","description":"Do first"}',
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    });

    const invalidChunk = deepSeekChunk({
      object: 'unexpected.object',
    });

    const iterator = normalizeDeepSeekStream(
      createStream([JSON.stringify(firstChunk), JSON.stringify(invalidChunk)])
    )[Symbol.asyncIterator]();

    await expect(iterator.next()).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('yields the completed earlier tool call but not the next one when a following chunk is invalid', async () => {
    const firstChunk = deepSeekChunk({
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call-0',
                type: 'function',
                function: {
                  name: 'create_subtask',
                  arguments: '{"title":"First","description":"Do first"}',
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    });

    const secondChunk = deepSeekChunk({
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 1,
                id: 'call-1',
                type: 'function',
                function: {
                  name: 'create_subtask',
                  arguments: '{"title":"Second","description":"Do second"}',
                },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    });

    const invalidChunk = deepSeekChunk({
      object: 'unexpected.object',
    });

    const iterator = normalizeDeepSeekStream(
      createStream([
        JSON.stringify(firstChunk),
        JSON.stringify(secondChunk),
        JSON.stringify(invalidChunk),
      ])
    )[Symbol.asyncIterator]();

    const firstEvent = await iterator.next();

    expect(firstEvent).toEqual({
      done: false,
      value: {
        type: 'subtask',
        subtask: {
          title: 'First',
          description: 'Do first',
        },
      },
    });

    await expect(iterator.next()).rejects.toThrow(AiInvalidResponseFormat);
  });
});
