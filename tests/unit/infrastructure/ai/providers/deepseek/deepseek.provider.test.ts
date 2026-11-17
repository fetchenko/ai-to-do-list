import { collect as collectStream } from '@tests/utils/collect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';

const fetchMock = vi.mocked(globalThis.fetch);

beforeEach(() => {
  fetchMock.mockReset();
});

function createResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

function deepSeekChunk(overrides: Record<string, unknown> = {}): string {
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
        finish_reason: 'tool_calls',
      },
    ],
    ...overrides,
  })}\n\n`;
}

describe('DeepSeekProvider.generate', () => {

  it('uses the requested response format', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'test-id',
          model: 'deepseek-v4-flash',
          choices: [
            {
              finish_reason: 'stop',
              message: { content: '{"subtasks":[]}' },
            },
          ],
          usage: {
            prompt_tokens: 1,
            completion_tokens: 2,
            total_tokens: 3,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await new DeepSeekProvider().generate('Create subtasks', {
      responseFormat: 'json_object',
    });

    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string).response_format
    ).toEqual({ type: 'json_object' });
  });

  it('uses text mode when requested', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'test-id',
          model: 'deepseek-v4-flash',
          choices: [
            {
              finish_reason: 'stop',
              message: { content: '{"message":"Generated text"}' },
            },
          ],
          usage: {
            prompt_tokens: 1,
            completion_tokens: 2,
            total_tokens: 3,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await new DeepSeekProvider().generate('Create subtasks', {
      responseFormat: 'text',
    });

    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string).response_format
    ).toEqual({ type: 'text' });
  });

  it('omits response_format when no response format is provided', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'test-id',
          model: 'deepseek-v4-flash',
          choices: [
            {
              finish_reason: 'stop',
              message: { content: '{"message":"Generated text"}' },
            },
          ],
          usage: {
            prompt_tokens: 1,
            completion_tokens: 2,
            total_tokens: 3,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await new DeepSeekProvider().generate('Create subtasks');

    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);

    expect(body).not.toHaveProperty('response_format');
  });
});

describe('DeepSeekProvider.stream', () => {

  it('passes the cancellation signal to fetch', async () => {
    fetchMock.mockResolvedValue(
      createResponse(`${deepSeekChunk()}data: [DONE]\n\n`)
    );
    const signal = new AbortController().signal;

    await collectStream(
      new DeepSeekProvider().stream(
        'Create subtasks',
        [createSubtaskTool],
        signal
      )
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.lastCall?.[1]).toEqual(
      expect.objectContaining({ signal })
    );
    expect(
      JSON.parse(fetchMock.mock.lastCall?.[1]?.body as string).tools
    ).toEqual([createSubtaskTool]);
  });

  it('throws when DeepSeek returns an error', async () => {
    fetchMock.mockResolvedValue(
      new Response('DeepSeek unavailable', { status: 500 })
    );
    await expect(
      collectStream(
        new DeepSeekProvider().stream(
          'test',
          [createSubtaskTool],
          new AbortController().signal
        )
      )
    ).rejects.toThrow('AI unavailable');
  });

  it('throws when DeepSeek returns no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );
    await expect(
      collectStream(
        new DeepSeekProvider().stream(
          'test',
          [createSubtaskTool],
          new AbortController().signal
        )
      )
    ).rejects.toThrow('AI response is empty');
  });
});
