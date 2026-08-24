import { collect } from '@tests/utils/collect';
import { createStream } from '@tests/utils/create-stream';
import { describe, expect, it } from 'vitest';

import { normilizeDeepSeekStream } from '@/infrastructure/ai/providers/deepseek/deepseek-stream.normilize';

function deepSeekEvent(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

describe('normilizeDeepSeekStream', () => {
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
      }),
    ]);

    const result = await collect(normilizeDeepSeekStream(stream));

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
      },
    ]);
  });

  it('emits content chunks', async () => {
    const stream = createStream([
      deepSeekEvent({
        choices: [
          {
            delta: {
              content: 'Hello',
            },
          },
        ],
      }),
      deepSeekEvent({
        choices: [
          {
            delta: {
              content: ' world',
            },
          },
        ],
      }),
    ]);

    const result = await collect(normilizeDeepSeekStream(stream));

    expect(result).toEqual([
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
      }),
    ]);

    const result = await collect(normilizeDeepSeekStream(stream));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'First',
          description: 'First description',
        },
      },
      {
        type: 'subtask',
        subtask: {
          title: 'Second',
          description: 'Second description',
        },
      },
      {
        type: 'done',
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
        choices: [
          {
            delta: {},
            finish_reason: 'tool_calls',
          },
        ],
      }),
    ]);

    const result = await collect(normilizeDeepSeekStream(stream));

    expect(result).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'Buy a phone',
          description: 'Choose a phone',
        },
      },
      { type: 'done' },
    ]);
  });
});
