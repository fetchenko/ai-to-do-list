import { describe, expect, it, vi, beforeEach } from 'vitest';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AppError, AiEmptyResponseError } from '@/shared/errors/app-error';

describe('streamSubtasks', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('streams subtasks from the API without exposing done metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response([
      JSON.stringify({ type: 'subtask', subtask: { title: 'Research phones', description: 'Compare available options' } }),
      JSON.stringify({ type: 'done', metadata: { model: 'deepseek-v4-flash', response: '[]', usage: {} } }),
    ].join('\n'), { headers: { 'Content-Type': 'application/x-ndjson' } }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await collect(streamSubtasks('task-1'))).toEqual([
      { type: 'subtask', subtask: { title: 'Research phones', description: 'Compare available options' } },
      { type: 'done' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith('/api/tasks/task-1/subtasks/stream', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    });
  });

  it('throws the API error returned by the stream endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { code: 'AI_UNAVAILABLE', status: 503, message: 'AI unavailable', details: { provider: 'deepseek' } } }),
      { status: 503 }
    )));

    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new AppError('AI_UNAVAILABLE', 503, 'AI unavailable', { provider: 'deepseek' })
    );
  });

  it('throws AiEmptyResponseError when the response body is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    await expect(collect(streamSubtasks('task-1'))).rejects.toEqual(
      new AiEmptyResponseError('Response body is missing')
    );
  });
});

async function collect<T>(stream: AsyncIterable<T>) {
  const result: T[] = [];
  for await (const value of stream) result.push(value);
  return result;
}
