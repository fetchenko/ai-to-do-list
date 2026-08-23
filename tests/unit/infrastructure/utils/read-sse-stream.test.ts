import { describe, expect, it } from 'vitest';

import { readSseStream } from '@/infrastructure/ai/utils/read-sse-stream.utils';

function createStream(chunks: string[]) {
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

async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];

  for await (const value of iterable) {
    result.push(value);
  }

  return result;
}

describe('readSseStream', () => {
  it('yields data from SSE events', async () => {
    const body = createStream(['data: {"foo":"bar"}\n\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['{"foo":"bar"}']);
  });

  it('yields multiple SSE events from a single chunk', async () => {
    const body = createStream([
      'data: first\n\ndata: second\n\ndata: third\n\n',
    ]);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['first', 'second', 'third']);
  });

  it('buffers an SSE event split across chunks', async () => {
    const body = createStream(['data: hel', 'lo\n\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['hello']);
  });

  it('handles an SSE separator split across chunks', async () => {
    const body = createStream(['data: hello\n', '\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['hello']);
  });

  it('supports CRLF line endings', async () => {
    const body = createStream(['data: first\r\n\r\ndata: second\r\n\r\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['first', 'second']);
  });

  it('ignores SSE events without a data field', async () => {
    const body = createStream([
      'event: message\nid: 123\n\n',
      'data: hello\n\n',
    ]);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['hello']);
  });

  it('yields [DONE] as an SSE data payload', async () => {
    const body = createStream(['data: [DONE]\n\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['[DONE]']);
  });

  it('yields the final event without an SSE separator', async () => {
    const body = createStream(['data: final']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['final']);
  });

  it('ignores empty SSE events', async () => {
    const body = createStream(['\n\n', 'data: hello\n\n', '\n\n']);

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['hello']);
  });

  it('handles UTF-8 characters split across chunks', async () => {
    const encoder = new TextEncoder();

    const bytes = encoder.encode('data: café\n\n');

    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 9));
        controller.enqueue(bytes.slice(9));
        controller.close();
      },
    });

    const result = await collect(readSseStream(body));

    expect(result).toEqual(['café']);
  });
});
