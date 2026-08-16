import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

vi.mock('@/infrastructure/supabase/client', () => ({ createClient: vi.fn() }));
vi.mock('@/features/tasks/repository/tasks.repository', () => ({ getLastPosition: vi.fn() }));

describe('generateSubtasks stream', () => {
  beforeEach(() => vi.restoreAllMocks());

  const responseFromChunks = (chunks: string[]) => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    return new Response(stream, { status: 200 });
  };

  it('handles NDJSON split across chunks and reports progressive subtasks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks([
        '{"type":"sub',
        'task","subtask":{"title":"One"}}\n{"type":"subtask","subtask":{"title":"Two"}}\n',
        '{"type":"done"}\n',
      ])
    );

    const onSubtask = vi.fn();
    const result = await generateSubtasks('task-1', { onSubtask });

    expect(result).toHaveLength(2);
    expect(result.map(({ title }) => title)).toEqual(['One', 'Two']);
    expect(onSubtask).toHaveBeenCalledTimes(2);
  });

  it('maps malformed JSON to the application error instead of leaking SyntaxError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks(['{"type":"subtask"\n'])
    );

    await expect(generateSubtasks('task-1')).rejects.toMatchObject({
      code: ErrorCode.AI_INVALID_RESPONSE_FORMAT,
    });
  });

  it('rejects a stream that ends without a done event', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks(['{"type":"subtask","subtask":{"title":"One"}}\n'])
    );

    await expect(generateSubtasks('task-1')).rejects.toMatchObject({
      code: ErrorCode.UNKNOWN,
      message: 'AI stream ended unexpectedly',
    });
  });

  it('preserves partial subtasks when the server emits an error event', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks([
        '{"type":"subtask","subtask":{"title":"One"}}\n',
        '{"type":"error","error":{"code":"AI_GENERATION_FAILED","message":"Provider failed","status":503}}\n',
      ])
    );

    const onSubtask = vi.fn();
    await expect(generateSubtasks('task-1', { onSubtask })).rejects.toBeInstanceOf(AppError);
    expect(onSubtask).toHaveBeenCalledTimes(1);
    expect(onSubtask.mock.calls[0][0]).toMatchObject({ title: 'One' });
  });

  it('rejects duplicate done events', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks([
        '{"type":"subtask","subtask":{"title":"One"}}\n',
        '{"type":"done"}\n{"type":"done"}\n',
      ])
    );

    await expect(generateSubtasks('task-1')).rejects.toMatchObject({
      code: ErrorCode.AI_INVALID_RESPONSE_FORMAT,
    });
  });

  it('rejects an empty successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      responseFromChunks(['{"type":"done"}\n'])
    );

    await expect(generateSubtasks('task-1')).rejects.toMatchObject({
      code: ErrorCode.AI_EMPTY_RESPONSE,
    });
  });
});
