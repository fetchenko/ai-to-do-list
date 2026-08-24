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
});
