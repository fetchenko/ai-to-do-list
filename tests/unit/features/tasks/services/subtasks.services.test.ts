import { describe, expect, it, vi, beforeEach } from 'vitest';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiEmptyResponseError, AiRequestError } from '@/shared/errors/app-error';

describe('streamSubtasks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('streams subtasks from the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        [
          JSON.stringify({
            type: 'subtask',
            subtask: {
              title: 'Research phones',
              description: 'Compare available options',
            },
          }),
          JSON.stringify({
            type: 'done',
            metadata: {
              model: 'deepseek-v4-flash',
              response: '[]',
              usage: {},
            },
          }),
        ].join('\n'),
        {
          headers: {
            'Content-Type': 'application/x-ndjson',
          },
        }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const chunks = [];

    for await (const chunk of streamSubtasks('task-1')) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'Research phones',
          description: 'Compare available options',
        },
      },
      {
        type: 'done',
        metadata: {
          model: 'deepseek-v4-flash',
          response: '[]',
          usage: {},
        },
      },
    ]);

    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/task-1/subtasks/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('throws AiRequestError for an unsuccessful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 }))
    );

    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new AiRequestError('Request failed')
    );
  });

  it('throws AiEmptyResponseError when the response body is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );

    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new AiEmptyResponseError('Response body is missing')
    );
  });
});

async function collect<T>(stream: AsyncIterable<T>) {
  const result: T[] = [];

  for await (const value of stream) {
    result.push(value);
  }

  return result;
}
