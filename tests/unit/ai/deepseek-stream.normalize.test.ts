import { collect } from '@tests/utils/collect';
import { createStream } from '@tests/utils/create-stream';
import { describe, expect, it } from 'vitest';

import { normalizeDeepSeekStream } from '@/infrastructure/ai/providers/deepseek/deepseek-stream.normalize';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

function deepSeekChunk(
  choice: Record<string, unknown>,
  overrides: Record<string, unknown> = {}
): string {
  return `data: ${JSON.stringify({
    id: 'test-id',
    object: 'chat.completion.chunk',
    created: 1750000000,
    model: 'deepseek-v4-flash',
    system_fingerprint: 'test-fingerprint',
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: null,
        ...choice,
      },
    ],
    ...overrides,
  })}\n\n`;
}

describe('normalizeDeepSeekStream', () => {
  it('normalizes a valid tool call stream', async () => {
    const stream = createStream([
      deepSeekChunk({
        delta: {
          tool_calls: [
            {
              index: 0,
              id: 'call_0',
              type: 'function',
              function: {
                name: 'create_subtask',
                arguments: '{"title":"First","description":"Do first"}',
              },
            },
          ],
        },
      }),
      deepSeekChunk(
        { delta: {}, finish_reason: 'tool_calls' },
        {
          usage: {
            prompt_tokens: 1,
            completion_tokens: 2,
            total_tokens: 3,
          },
        }
      ),
      'data: [DONE]\n\n',
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).resolves.toEqual([
      {
        type: 'subtask',
        subtask: { title: 'First', description: 'Do first' },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          model: 'deepseek-v4-flash',
          finishReason: 'tool_calls',
          response:
            '[{"title":"First","description":"Do first"}]',
        }),
      },
    ]);
  });

  it('accumulates fragmented tool-call arguments', async () => {
    const stream = createStream([
      deepSeekChunk({
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
      }),
      deepSeekChunk({
        delta: {
          tool_calls: [
            {
              index: 0,
              function: {
                arguments: 'a phone","description":"Choose a phone"}',
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      }),
      'data: [DONE]\n\n',
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).resolves.toEqual([
      {
        type: 'subtask',
        subtask: { title: 'Buy a phone', description: 'Choose a phone' },
      },
      {
        type: 'done',
        metadata: expect.objectContaining({
          response:
            '[{"title":"Buy a phone","description":"Choose a phone"}]',
        }),
      },
    ]);
  });

  it('emits multiple subtasks in tool-call order', async () => {
    const stream = createStream([
      deepSeekChunk({
        delta: {
          tool_calls: [
            {
              index: 0,
              id: 'call_0',
              function: {
                name: 'create_subtask',
                arguments: '{"title":"First","description":"First description"}',
              },
            },
          ],
        },
      }),
      deepSeekChunk(
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
        { usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 } }
      ),
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
          response:
            '[{"title":"First","description":"First description"},{"title":"Second","description":"Second description"}]',
        }),
      },
    ]);
  });

  it('flushes the current tool call before emitting done', async () => {
    const stream = createStream([
      deepSeekChunk({
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
      }),
      deepSeekChunk({ delta: {}, finish_reason: 'tool_calls' }),
      'data: [DONE]\n\n',
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).resolves.toEqual([
      {
        type: 'subtask',
        subtask: { title: 'Buy a phone', description: 'Choose a phone' },
      },
      { type: 'done', metadata: expect.objectContaining({ model: 'deepseek-v4-flash' }) },
    ]);
  });

  it("doesn't emit content chunks", async () => {
    const stream = createStream([
      deepSeekChunk({ delta: { content: 'Hello' } }),
      deepSeekChunk({ delta: { content: ' world' } }),
      'data: [DONE]\n\n',
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).resolves.toEqual([]);
  });

  it('rejects malformed JSON', async () => {
    await expect(
      collect(normalizeDeepSeekStream(createStream(['not-json'])))
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('rejects a chunk that does not match the schema', async () => {
    await expect(
      collect(
        normalizeDeepSeekStream(
          createStream([
            deepSeekChunk({ delta: {} }, { object: 'unexpected.object' }),
          ])
        )
      )
    ).rejects.toThrow(AiInvalidResponseFormat);
  });

  it('throws when the response is truncated before tool calls complete', async () => {
    const stream = createStream([
      deepSeekChunk({
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
      deepSeekChunk({ delta: {}, finish_reason: 'content_filter' }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat(
        'DeepSeek stopped the response because of its content filter'
      )
    );
  });

  it('throws when DeepSeek stops because of insufficient system resources', async () => {
    const stream = createStream([
      deepSeekChunk({
        delta: {},
        finish_reason: 'insufficient_system_resource',
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
      deepSeekChunk({ delta: { content: 'partial response' } }),
    ]);

    await expect(collect(normalizeDeepSeekStream(stream))).rejects.toEqual(
      new AiInvalidResponseFormat('DeepSeek stream ended unexpectedly')
    );
  });
});
