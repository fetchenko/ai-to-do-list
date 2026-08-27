import { beforeEach, describe, expect, it, vi } from 'vitest';

import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';

function createResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

async function collectStream(stream: AsyncIterable<unknown>): Promise<unknown[]> {
  const result = [];

  for await (const chunk of stream) {
    result.push(chunk);
  }

  return result;
}

describe('DeepSeekProvider.stream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the expected streaming request to DeepSeek', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse(
        'data: {"model":"deepseek-v4-flash","choices":[{"delta":{},"finish_reason":"tool_calls"}]}\n\ndata: [DONE]\n\n'
      )
    );

    const provider = new DeepSeekProvider();
    await collectStream(provider.stream('Create subtasks'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('https://api.deepseek.com/chat/completions');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toMatchObject({
      Authorization: expect.stringContaining('Bearer '),
      'Content-Type': 'application/json',
    });

    expect(JSON.parse(options?.body as string)).toMatchObject({
      model: 'deepseek-v4-flash',
      messages: [{ role: 'user', content: 'Create subtasks' }],
      stream: true,
      stream_options: { include_usage: true },
      tool_choice: 'auto',
    });

    expect(JSON.parse(options?.body as string).tools).toHaveLength(1);
  });

  it('throws when DeepSeek returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('DeepSeek unavailable', { status: 500 })
    );

    const provider = new DeepSeekProvider();

    await expect(collectStream(provider.stream('test'))).rejects.toThrow(
      'AI unavailable'
    );
  });

  it('throws when DeepSeek returns no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const provider = new DeepSeekProvider();

    await expect(collectStream(provider.stream('test'))).rejects.toThrow(
      'AI response is empty'
    );
  });
});
