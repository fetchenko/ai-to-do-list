import { collect } from '@tests/utils/collect';
import { createStream } from '@tests/utils/create-stream';
import { describe, expect, it } from 'vitest';

import { normalizeDeepSeekStream } from '@/infrastructure/ai/providers/deepseek/deepseek-stream.normalize';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

function deepSeekEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

describe('normalizeDeepSeekStream', () => {
  it('accumulates a tool call and emits a subtask when complete', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_0',
                  type: 'function',
                  function: {
                    name: 'create_subtask',
                    arguments: '{"title":"Buy ',
                  },
                },
              ],
            },
          },
        ],
      }),
      deepSeekEvent({
        model: 'deepseek-v4-flash',
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: {
                    arguments:
                      'a phone","description":"Choose a suitable phone"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: {
          prompt_tokens: 514,
          completion_tokens: 451,
          total_tokens: 965,
          prompt_tokens_details: { cached_tokens: 512 },
          completion_tokens_details: { reasoning_tokens: 73 },
          prompt_cache_hit_tokens: 512,
          prompt_cache_miss_tokens: 2,
        },
      }),
      'data: [DONE]\n\n',
    ]);

    const result = await collect(normalizeDeepSeekStream(stream));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'Buy a phone',
          description: 'Choose a suitable phone',
        },
      },
      {
        type: 'done',
        metadata: {
          model: 'deepseek-v4-flash',
          response:
            '[{"title":"Buy a phone","description":"Choose a suitable phone"}]',
          finishReason: 'tool_calls',
          usage: {
            inputTokens: 514,
            outputTokens: 451,
            totalTokens: 965,
            reasoningTokens: 73,
            cacheHitTokens: 512,
            cacheMissTokens: 2,
          },
        },
      },
    ]);
  });

  it('emits content chunks', async () => {
    const stream = createStream([
      deepSeekEvent({ choices: [{ delta: { content: 'Hello' } }] }),
      deepSeekEvent({ choices: [{ delta: { content: ' world' } }] }),
      'data: [DONE]\n\n',
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).resolves.toEqual([
      { type: 'content', content: 'Hello' },
      { type: 'content', content: ' world' },
    ]);
  });

  it('emits multiple subtasks in tool-call order', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_0',
                  function: {
                    name: 'create_subtask',
                    arguments:
                      '{"title":"First","description":"First description"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      deepSeekEvent({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 1,
                  id: 'call_1',
                  function: {
                    name: 'create_subtask',
                    arguments:
                      '{"title":"Second","description":"Second description"}',
                  },
                },
              ],
            },
            finish_reason: 'tool_calls',
          },
        ],
        usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
      }),
      'data: [DONE]\n\n',
    ]);

    const result = await collect(normalizeDeepSeekStream(stream));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: { title: 'First', description: 'First description' },
      },
      {
        type: 'subtask',
        subtask: { title: 'Second', description: 'Second description' },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: undefined,
          response:
            '[{"title":"First","description":"First description"},{"title":"Second","description":"Second description"}]',
        }),
      },
    ]);
  });

  it('flushes the current tool call before emitting done', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_0',
                  function: {
                    name: 'create_subtask',
                    arguments:
                      '{"title":"Buy a phone","description":"Choose a phone"}',
                  },
                },
              ],
            },
          },
        ],
      }),
      deepSeekEvent({
        model: 'deepseek-v4-flash',
        choices: [{ delta: {}, finish_reason: 'tool_calls' }],
      }),
      'data: [DONE]\n\n',
    ]);

    const result = await collect(normalizeDeepSeekStream(stream));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: { title: 'Buy a phone', description: 'Choose a phone' },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          response: '[{"title":"Buy a phone","description":"Choose a phone"}]',
        }),
      },
    ]);
  });

  it('throws when the response is truncated before tool calls complete', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {
              tool_calls: [
                {
                  index: 0,
                  id: 'call_0',
                  function: {
                    name: 'create_subtask',
                    arguments: '{"title":"Incomplete',
                  },
                },
              ],
            },
            finish_reason: 'length',
          },
        ],
      }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat(
        'DeepSeek response was truncated before completing tool calls'
      )
    );
  });

  it('throws when DeepSeek stops because of the content filter', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {},
            finish_reason: 'content_filter',
          },
        ],
      }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat(
        'DeepSeek stopped the response because of its content filter'
      )
    );
  });

  it('throws when DeepSeek stops because of insufficient system resources', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {},
            finish_reason: 'insufficient_system_resource',
          },
        ],
      }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat(
        'DeepSeek stopped the response because of insufficient system resources'
      )
    );
  });

  it('throws when the stream ends without [DONE] or tool_calls finish reason', async () => {
    const stream = createStream([
      deepSeekEvent({ choices: [{ delta: { content: 'partial response' } }] }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat('DeepSeek returned an invalid stream chunk')
    );
  });
});
