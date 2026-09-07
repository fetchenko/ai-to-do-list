import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import type { AiGeneratedTask } from '@/features/tasks/types/tasks.types';
import { AiUnavailableError } from '@/shared/errors/ai-app-error';
import { ValidationRequestError } from '@/shared/errors/app-error';
import type { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

vi.mock('@/features/tasks/services/subtasks.service', () => ({
  streamSubtasks: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

const mockedStreamSubtasks = vi.mocked(streamSubtasks);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createStream(
  chunks: SubtaskStreamEvent[]
): AsyncGenerator<SubtaskStreamEvent> {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

function createStreamSubtask(
  overrides: {
    title?: string;
    description?: string;
  } = {}
): SubtaskStreamEvent {
  return {
    type: 'subtask',
    subtask: {
      title: 'Write tests',
      description: 'Write unit tests',
      ...overrides,
    },
  };
}

describe('useSubtaskDrafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generation', () => {
    it('streams generated drafts through onSubtask', async () => {
      mockedStreamSubtasks.mockReturnValue(
        createStream([createStreamSubtask(), { type: 'done' }])
      );

      const onSubtask = vi.fn();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(onSubtask).toHaveBeenCalledTimes(1);
      });

      expect(onSubtask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Write tests',
          description: 'Write unit tests',
        })
      );

      expect(result.current.error).toBeNull();
    });

    it('streams multiple generated drafts', async () => {
      mockedStreamSubtasks.mockReturnValue(
        createStream([
          createStreamSubtask({
            title: 'Write tests',
          }),
          createStreamSubtask({
            title: 'Review tests',
          }),
          { type: 'done' },
        ])
      );

      const onSubtask = vi.fn();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(onSubtask).toHaveBeenCalledTimes(2);
      });

      expect(onSubtask).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          title: 'Write tests',
        })
      );

      expect(onSubtask).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          title: 'Review tests',
        })
      );
    });

    it('assigns a generated id to streamed drafts', async () => {
      mockedStreamSubtasks.mockReturnValue(
        createStream([
          createStreamSubtask({
            title: 'Write tests',
          }),
        ])
      );

      const onSubtask = vi.fn<(draft: AiGeneratedTask) => void>();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(onSubtask).toHaveBeenCalled();
      });

      const receivedDraft = onSubtask.mock.calls[0][0];

      expect(receivedDraft).toEqual(
        expect.objectContaining({
          title: 'Write tests',
        })
      );

      expect(receivedDraft.id).toEqual(expect.any(String));
    });

    it('stays pending until the stream resolves', async () => {
      let resolve!: () => void;

      mockedStreamSubtasks.mockReturnValue(
        (async function* () {
          await new Promise<void>((r) => {
            resolve = r;
          });

          yield createStreamSubtask({
            title: 'Draft',
          });
        })()
      );

      const onSubtask = vi.fn();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      expect(onSubtask).not.toHaveBeenCalled();

      await act(async () => {
        resolve();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(onSubtask).toHaveBeenCalledTimes(1);
    });
  });

  describe('errors', () => {
    it('handles thrown stream errors', async () => {
      const error = new AiUnavailableError('AI failed');

      mockedStreamSubtasks.mockImplementation(() =>
        (async function* () {
          throw error;
        })()
      );

      const { result } = renderHook(() => useSubtaskDrafts('task-1', vi.fn()), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

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

      const { result } = renderHook(() => useSubtaskDrafts('task-1', vi.fn()), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(
          new AiUnavailableError('AI unavailable')
        );
      });
    });

    it('does not call the service for a missing task id', async () => {
      const onSubtask = vi.fn();

      const { result } = renderHook(() => useSubtaskDrafts('', onSubtask), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(
          new ValidationRequestError('Missing task id')
        );
      });

      expect(mockedStreamSubtasks).not.toHaveBeenCalled();
      expect(onSubtask).not.toHaveBeenCalled();
    });
  });

  describe('retry', () => {
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
            createStreamSubtask({
              title: 'Recovered draft',
            }),
            { type: 'done' },
          ])
        );

      const onSubtask = vi.fn();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(onSubtask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Recovered draft',
          })
        );
      });

      expect(result.current.error).toBeNull();
      expect(mockedStreamSubtasks).toHaveBeenCalledTimes(2);
    });

    it('clears error immediately when retry starts', async () => {
      const error = new AiUnavailableError('Initial failure');

      mockedStreamSubtasks
        .mockImplementationOnce(() =>
          (async function* () {
            throw error;
          })()
        )
        .mockImplementationOnce(async function* () {
          await new Promise(() => {});
        });

      const { result } = renderHook(() => useSubtaskDrafts('task-1', vi.fn()), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      act(() => {
        result.current.cancel();
      });
    });
  });

  describe('discard', () => {
    it('resets the mutation state on discard', async () => {
      const error = new AiUnavailableError('AI failed');

      mockedStreamSubtasks.mockImplementation(() =>
        (async function* () {
          throw error;
        })()
      );

      const { result } = renderHook(() => useSubtaskDrafts('task-1', vi.fn()), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });

      act(() => {
        result.current.discard();
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });

      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe('cancellation', () => {
    it('passes an AbortSignal to the streaming service', async () => {
      mockedStreamSubtasks.mockReturnValue(createStream([{ type: 'done' }]));

      const { result } = renderHook(() => useSubtaskDrafts('task-1', vi.fn()), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(mockedStreamSubtasks).toHaveBeenCalledWith(
        'task-1',
        expect.any(AbortSignal)
      );
    });

    it('aborts the active request when cancelled', async () => {
      let resolve!: () => void;
      let receivedSignal!: AbortSignal;

      mockedStreamSubtasks.mockImplementation(
        async function* (_taskId, signal) {
          receivedSignal = signal!;

          await new Promise<void>((r) => {
            resolve = r;
          });

          return;
        }
      );

      const onSubtask = vi.fn();

      const { result } = renderHook(
        () => useSubtaskDrafts('task-1', onSubtask),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(true);
      });

      expect(receivedSignal.aborted).toBe(false);

      act(() => {
        result.current.cancel();
      });

      expect(receivedSignal.aborted).toBe(true);

      await act(async () => {
        resolve();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(onSubtask).not.toHaveBeenCalled();
    });
  });
});
