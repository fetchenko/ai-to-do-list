import { collect } from '@tests/utils/collect';
import { createStream } from '@tests/utils/create-stream';
import { describe, expect, it } from 'vitest';

import { readJsonStream } from '@/features/tasks/utils/read-json-stream';

describe('readJsonStream', () => {
  it('parses JSON remaining in the final buffer', async () => {
    const response = new Response(createStream(['{"type":"done"', '}']));

    const chunks = await collect(readJsonStream(response.body!));

    expect(chunks).toEqual([
      {
        type: 'done',
      },
    ]);
  });

  it('parses the final JSON object when it is not terminated by a newline', async () => {
    const response = new Response(
      createStream([
        '{"type":"subtask","subtask":{"title":"First","description":"Do it"}}\n',
        '{"type":"done"}',
      ])
    );

    const chunks = await collect(readJsonStream(response.body!));

    expect(chunks).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'First',
          description: 'Do it',
        },
      },
      {
        type: 'done',
      },
    ]);
  });

  it('handles JSON split across arbitrary network chunks', async () => {
    const response = new Response(
      createStream([
        '{"type":"su',
        'btask","subtask":{"title":"First","description":"Do it"}}',
        '\n{"type":"do',
        'ne"}',
      ])
    );

    const chunks = await collect(readJsonStream(response.body!));

    expect(chunks).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'First',
          description: 'Do it',
        },
      },
      {
        type: 'done',
      },
    ]);
  });

  it('parses multiple JSON objects', async () => {
    const stream = createStream(['{"type":"done"}\n{"type":"done"}\n']);

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([{ type: 'done' }, { type: 'done' }]);
  });

  it('ignores empty lines', async () => {
    const stream = createStream(['\n', '{"type":"done"}\n', '\n']);

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([{ type: 'done' }]);
  });

  it('ignores whitespace-only lines', async () => {
    const stream = createStream(['  \n', '{"type":"done"}\n', '   \n']);

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([{ type: 'done' }]);
  });

  it('returns no values for an empty stream', async () => {
    const stream = createStream([]);

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([]);
  });

  it('returns no values for a whitespace-only stream', async () => {
    const stream = createStream(['  \n\n   ']);

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([]);
  });

  it('throws when a JSON object is malformed', async () => {
    const stream = createStream(['{"type":"done"\n']);

    await expect(collect(readJsonStream(stream))).rejects.toThrow(SyntaxError);
  });

  it('handles UTF-8 characters split across chunks', async () => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode('{"type":"content","content":"😀"}\n');

    const split = bytes.length - 3;

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    });

    const result = await collect(readJsonStream(stream));

    expect(result).toEqual([
      {
        type: 'content',
        content: '😀',
      },
    ]);
  });
});
