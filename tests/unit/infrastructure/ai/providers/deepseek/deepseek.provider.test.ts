import { beforeEach, describe, expect, it, vi } from 'vitest';

import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';

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

async function collectStream(stream: AsyncIterable<unknown>): Promise<unknown[]> {
  const result: unknown[] = [];
  for await (const chunk of stream) result.push(chunk);
  return result;
}

describe('DeepSeekProvider.stream', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('passes the cancellation signal to fetch', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(`${deepSeekChunk()}data: [DONE]\n\n`)
    );
    const signal = new AbortController().signal;

    await collectStream(new DeepSeekProvider().stream('Create subtasks', signal));

    expect(fetchMock.mock.calls[0][1]).toEqual(expect.objectContaining({ signal }));
  });

  it('throws when DeepSeek returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('DeepSeek unavailable', { status: 500 })
    );
    await expect(
      collectStream(new DeepSeekProvider().stream('test', new AbortController().signal))
    ).rejects.toThrow('AI unavailable');
  });

  it('throws when DeepSeek returns no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 200 }));
    await expect(
      collectStream(new DeepSeekProvider().stream('test', new AbortController().signal))
    ).rejects.toThrow('AI response is empty');
  });
});
