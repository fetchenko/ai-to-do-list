import { collect } from '@tests/utils/collect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

describe('streamSubtasks', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('streams subtasks from the API without exposing done metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        [
          JSON.stringify({
            type: 'event',
            data: {
              title: 'Research phones',
              description: 'Compare available options',
            },
          }),
          JSON.stringify({
            type: 'done',
          }),
        ].join('\n'),
        { headers: { 'Content-Type': 'application/x-ndjson' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    expect(await collect(streamSubtasks('task-1'))).toEqual([
      {
        type: 'event',
        data: {
          title: 'Research phones',
          description: 'Compare available options',
        },
      },
      { type: 'done' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/task-1/subtasks/stream',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  it('throws the API error returned by the stream endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'AI_UNAVAILABLE',
              status: 503,
              message: 'AI unavailable',
              details: { provider: 'deepseek' },
            },
          }),
          { status: 503 }
        )
      )
    );

    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new ClientError(ErrorCode.AI_UNAVAILABLE, 503)
    );
  });

  it('throws AiEmptyResponseError when the response body is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    );
    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new ClientError(ErrorCode.AI_EMPTY_RESPONSE)
    );
  });
});
