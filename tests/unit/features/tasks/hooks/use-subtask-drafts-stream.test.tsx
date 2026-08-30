import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubtaskDraftsStream } from '@/features/tasks/hooks/use-subtask-drafts-stream';
import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import type { AiTask } from '@/features/tasks/types/tasks.types';
import type { SubtaskStreamEvent } from '@/features/tasks/types/stream-event.types';
import { AiUnavailableError, ValidationRequestError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/services/subtasks.service', () => ({ streamSubtasks: vi.fn() }));
vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

const mockedStreamSubtasks = vi.mocked(streamSubtasks);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function createStream(
  chunks: SubtaskStreamEvent[]
): AsyncGenerator<SubtaskStreamEvent> {
  return (async function* () {
    for (const chunk of chunks) yield chunk;
  })();
}

describe('useSubtaskDraftsStream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates an AbortSignal and passes it to the streaming service', async () => {
    mockedStreamSubtasks.mockReturnValue(createStream([{ type: 'done' }]));
    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    expect(mockedStreamSubtasks).toHaveBeenCalledWith(
      'task-1',
      expect.any(AbortSignal)
    );
  });

  it('aborts the active request when cancel is called', async () => {
    let resolve!: () => void;
    let receivedSignal!: AbortSignal;

    mockedStreamSubtasks.mockImplementation((_taskId, signal) => {
      receivedSignal = signal as AbortSignal;

      return (async function* () {
        await new Promise<void>((r) => {
          resolve = r;
        });
      })();
    });

    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.isGenerating).toBe(true));

    act(() => result.current.cancel());

    expect(receivedSignal.aborted).toBe(true);
    await act(async () => resolve());
  });

  it('streams every subtask to onSubtask', async () => {
    mockedStreamSubtasks.mockReturnValue(
      createStream([
        {
          type: 'subtask',
          subtask: { title: 'Research phones', description: 'Compare options' },
        },
        { type: 'subtask', subtask: { title: 'Compare prices' } },
        { type: 'done' },
      ])
    );

    const onSubtask = vi.fn<(draft: AiTask) => void>();
    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', onSubtask),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    expect(onSubtask).toHaveBeenCalledTimes(2);
    expect(onSubtask).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        title: 'Research phones',
        id: expect.any(String),
      })
    );
    expect(onSubtask).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        title: 'Compare prices',
        id: expect.any(String),
      })
    );
  });

  it('stays pending until the stream resolves', async () => {
    let resolve!: () => void;

    mockedStreamSubtasks.mockReturnValue(
      (async function* () {
        await new Promise<void>((r) => {
          resolve = r;
        });
        yield { type: 'subtask', subtask: { title: 'Draft' } };
      })()
    );

    const onSubtask = vi.fn();
    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', onSubtask),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.isGenerating).toBe(true));

    expect(onSubtask).not.toHaveBeenCalled();

    await act(async () => resolve());
    await waitFor(() => expect(result.current.isGenerating).toBe(false));
    expect(onSubtask).toHaveBeenCalledTimes(1);
  });

  it('resets the mutation state on discard', async () => {
    mockedStreamSubtasks.mockReturnValue(
      createStream([{ type: 'subtask', subtask: { title: 'Draft' } }])
    );

    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    act(() => result.current.discard());

    expect(result.current.error).toBeNull();
    expect(result.current.isGenerating).toBe(false);
  });

  it('handles thrown stream errors', async () => {
    const error = new AiUnavailableError('AI failed');
    mockedStreamSubtasks.mockImplementation(() =>
      (async function* () {
        throw error;
      })()
    );

    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());

    await waitFor(() => expect(result.current.error).toEqual(error));
    expect(result.current.isGenerating).toBe(false);
  });

  it('converts an error event to AppError', async () => {
    mockedStreamSubtasks.mockReturnValue(
      createStream([
        {
          type: 'error',
          error: {
            success: false,
            status: 503,
            code: 'AI_UNAVAILABLE',
            message: 'AI unavailable',
            details: 'AI unavailable',
          },
        },
      ])
    );

    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());

    await waitFor(() =>
      expect(result.current.error).toEqual(
        new AiUnavailableError('AI unavailable')
      )
    );
  });

  it('retries after an error and receives new drafts', async () => {
    const error = new AiUnavailableError('AI failed');

    mockedStreamSubtasks
      .mockImplementationOnce(() =>
        (async function* () {
          throw error;
        })()
      )
      .mockReturnValueOnce(
        createStream([
          { type: 'subtask', subtask: { title: 'Recovered' } },
          { type: 'done' },
        ])
      );

    const onSubtask = vi.fn();
    const { result } = renderHook(
      () => useSubtaskDraftsStream('task-1', onSubtask),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());
    await waitFor(() => expect(result.current.error).toEqual(error));

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.isGenerating).toBe(false));

    expect(mockedStreamSubtasks).toHaveBeenCalledTimes(2);
    expect(onSubtask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Recovered' })
    );
  });

  it('does not call the service for a missing task id', async () => {
    const { result } = renderHook(
      () => useSubtaskDraftsStream('', vi.fn()),
      { wrapper: createWrapper() }
    );

    act(() => result.current.generate());

    await waitFor(() =>
      expect(result.current.error).toEqual(
        new ValidationRequestError('Missing task id')
      )
    );
    expect(mockedStreamSubtasks).not.toHaveBeenCalled();
  });
});
