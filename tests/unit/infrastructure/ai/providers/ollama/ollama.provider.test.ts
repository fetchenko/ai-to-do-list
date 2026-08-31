import { collect as collectStream } from '@tests/utils/collect';
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

function ollamaDoneChunk() {
  return {
    model: 'qwen3:8b',
    message: { role: 'assistant', content: '' },
    done: true,
    done_reason: 'stop',
  };
}

describe('OllamaProvider.stream', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('passes the cancellation signal to fetch', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(createResponse([ollamaDoneChunk()]));
    const signal = new AbortController().signal;

    await collectStream(new OllamaProvider().stream('Create subtasks', signal));

    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ signal })
    );
  });

  it('throws when Ollama returns an error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Ollama unavailable', { status: 500 })
    );
    await expect(
      collectStream(
        new OllamaProvider().stream('test', new AbortController().signal)
      )
    ).rejects.toThrow('AI unavailable');
  });

  it('throws when Ollama returns no response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 200 })
    );
    await expect(
      collectStream(
        new OllamaProvider().stream('test', new AbortController().signal)
      )
    ).rejects.toThrow('AI response is empty');
  });
});
