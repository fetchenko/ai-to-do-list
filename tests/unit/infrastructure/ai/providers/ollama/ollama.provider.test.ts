import { collect as collectStream } from '@tests/utils/collect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';

const fetchMock = vi.mocked(globalThis.fetch);

beforeEach(() => {
  fetchMock.mockReset();
});

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
    created_at: new Date().toISOString(),
    message: { role: 'assistant', content: '' },
    done: true,
    done_reason: 'stop',
  };
}

describe('OllamaProvider.generate', () => {
  it('passes the response schema and cancellation signal to fetch', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'qwen3:8b',
          created_at: new Date().toISOString(),
          response: '{"subtasks":[]}',
          done: true,
          done_reason: 'stop',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    const responseSchema = {
      type: 'object',
      properties: { subtasks: { type: 'array' } },
    };
    const signal = new AbortController().signal;

    await new OllamaProvider().generate(
      'Create subtasks',
      { responseSchema },
      signal
    );

    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ signal })
    );
    expect(
      JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
    ).toEqual(expect.objectContaining({ format: responseSchema }));
  });

  it('omits format when no response schema is provided', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          model: 'qwen3:8b',
          created_at: new Date().toISOString(),
          response: '{"subtasks":[]}',
          done: true,
          done_reason: 'stop',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await new OllamaProvider().generate('Create subtasks');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.lastCall?.[1]?.body as string);

    expect(body).not.toHaveProperty('format');
  });
});

describe('OllamaProvider.stream', () => {
  it('passes the cancellation signal to fetch', async () => {
    fetchMock.mockResolvedValue(createResponse([ollamaDoneChunk()]));
    const signal = new AbortController().signal;

    await collectStream(
      new OllamaProvider().stream(
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

  it('throws when Ollama returns an error', async () => {
    fetchMock.mockResolvedValue(
      new Response('Ollama unavailable', { status: 500 })
    );
    await expect(
      collectStream(
        new OllamaProvider().stream(
          'test',
          [createSubtaskTool],
          new AbortController().signal
        )
      )
    ).rejects.toThrow('AI unavailable');
  });

  it('throws when Ollama returns no response body', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: 200 })
    );
    await expect(
      collectStream(
        new OllamaProvider().stream(
          'test',
          [createSubtaskTool],
          new AbortController().signal
        )
      )
    ).rejects.toThrow('AI response is empty');
  });
});
