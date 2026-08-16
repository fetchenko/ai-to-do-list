import { describe, expect, it, vi } from 'vitest';
import { OllamaProvider } from './ollama.provider';

function jsonStream(chunks: string[]) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

describe('OllamaProvider.generateStream', () => {
  it('converts Ollama NDJSON into content and completion events', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        jsonStream([
          '{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:00Z","response":"{\\"subtasks\\":[","done":false}\n',
          '{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:01Z","response":"{\\"title\\":\\"Create project directory\\"}]}","done":false}\n',
          '{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:02Z","response":"","done":true,"done_reason":"stop"}\n',
        ])
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new OllamaProvider();
    const events = [];

    for await (const event of provider.generateStream('generate subtasks')) {
      events.push(event);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      body: expect.stringContaining('"stream":true'),
    });

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({
      type: 'content',
      content: '{"subtasks":[',
    });
    expect(events[1]).toEqual({
      type: 'content',
      content: '{"title":"Create project directory"}]}'
    });
    expect(events[2]?.type).toBe('complete');

    if (events[2]?.type === 'complete') {
      expect(events[2].response.data).toEqual({
        subtasks: [
          { title: 'Create project directory' },
        ],
      });
    }
  });

  it('handles NDJSON split across HTTP chunks', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        jsonStream([
          '{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:00Z","response":"{\\"subtasks\\":[{\\"title\\":\\"One\\"}]}","done":false}\n{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:01Z","response":"","done":true,',
          '"done_reason":"stop"}\n',
        ])
      )
    );

    vi.stubGlobal('fetch', fetchMock);

    const provider = new OllamaProvider();
    const events = [];

    for await (const event of provider.generateStream('generate subtasks')) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toEqual([
      'content',
      'complete',
    ]);
  });

  it('throws when Ollama does not return a response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );

    const provider = new OllamaProvider();
    const stream = provider.generateStream('generate subtasks');

    await expect(stream.next()).rejects.toThrow(
      'AI stream has no response body'
    );
  });

  it('throws when the stream ends without a done event', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          jsonStream([
            '{"model":"qwen2.5-coder:1.5b","created_at":"2026-08-15T14:22:00Z","response":"{\\"subtasks\\":[]}","done":false}\n',
          ])
        )
      )
    );

    const provider = new OllamaProvider();
    const stream = provider.generateStream('generate subtasks');

    await expect(stream.next()).rejects.toThrow('AI stream did not complete');
  });

  it('throws for an invalid Ollama stream chunk', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(jsonStream(['{"invalid":true}\n']))
      )
    );

    const provider = new OllamaProvider();
    const stream = provider.generateStream('generate subtasks');

    await expect(stream.next()).rejects.toThrow('Invalid AI stream chunk');
  });
});
