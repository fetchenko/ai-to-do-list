import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';

function createResponse(chunks: unknown[]): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
      }

      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}

async function collectStream(stream: AsyncIterable<unknown>): Promise<unknown[]> {
  const result = [];

  for await (const chunk of stream) {
    result.push(chunk);
  }

  return result;
}

describe('OllamaProvider.stream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the expected request to Ollama', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createResponse([
        {
          model: 'qwen3:8b',
          created_at: '2026-08-25T11:51:01.045569102Z',
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 'call_1',
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
        },
      ])
    );

    const provider = new OllamaProvider();
    const result = await collectStream(provider.stream('Create a grocery subtask'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe('http://localhost:11434/api/chat');
    expect(options?.method).toBe('POST');
    expect(options?.headers).toEqual({ 'Content-Type': 'application/json' });

    expect(JSON.parse(options?.body as string)).toMatchObject({
      model: 'qwen3:8b',
      messages: [{ role: 'user', content: 'Create a grocery subtask' }],
      stream: true,
      think: false,
    });

    expect(JSON.parse(options?.body as string).tools).toHaveLength(1);

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
        metadata: expect.objectContaining({
          model: 'qwen3:8b',
          response: '[{"title":"Buy groceries","description":"Buy groceries from the store"}]',
        }),
      },
    ]);
  });

  it('throws when Ollama returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Ollama unavailable', { status: 500 })
    );

    const provider = new OllamaProvider();

    await expect(collectStream(provider.stream('test'))).rejects.toThrow(
      'AI unavailable'
    );
  });

  it('throws when Ollama returns no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const provider = new OllamaProvider();

    await expect(collectStream(provider.stream('test'))).rejects.toThrow(
      'AI response is empty'
    );
  });
});
