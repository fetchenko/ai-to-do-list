import { describe, expect, it } from 'vitest';

import { readJsonStream } from '@/infrastructure/ai/utils/read-json-stream.utils';

function createStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

describe('readJsonStream', () => {
  it('reads multiple JSON lines from a stream', async () => {
    const body = createStream([
      '{"message":{"content":"Hello"}}\n',
      '{"message":{"content":"world"}}\n',
    ]);

    const result = [];

    for await (const chunk of readJsonStream(body)) {
      result.push(chunk);
    }

    expect(result).toEqual([
      {
        message: {
          content: 'Hello',
        },
      },
      {
        message: {
          content: 'world',
        },
      },
    ]);
  });

  it('handles JSON split across multiple chunks', async () => {
    const body = createStream(['{"message":{"con', 'tent":"Hello"}}\n']);

    const result = [];

    for await (const chunk of readJsonStream(body)) {
      result.push(chunk);
    }

    expect(result).toEqual([
      {
        message: {
          content: 'Hello',
        },
      },
    ]);
  });

  it('handles the final JSON object without a trailing newline', async () => {
    const body = createStream(['{"message":{"content":"Hello"}}']);

    const result = [];

    for await (const chunk of readJsonStream(body)) {
      result.push(chunk);
    }

    expect(result).toEqual([
      {
        message: {
          content: 'Hello',
        },
      },
    ]);
  });

  it('ignores empty lines', async () => {
    const body = createStream(['{"value":1}\n\n', '\n{"value":2}\n']);

    const result = [];

    for await (const chunk of readJsonStream(body)) {
      result.push(chunk);
    }

    expect(result).toEqual([{ value: 1 }, { value: 2 }]);
  });

  it('throws when a line contains invalid JSON', async () => {
    const body = createStream(['{"value":1}\n', 'not-json\n']);

    const consume = async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of readJsonStream(body)) {
        // Consume the stream.
      }
    };

    await expect(consume()).rejects.toThrow();
  });
});
