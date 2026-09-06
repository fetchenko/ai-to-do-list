import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import {
  AiUnavailableError,
  ValidationRequestError,
} from '@/shared/errors/app-error';

vi.mock('@/features/tasks/services/subtasks.service', () => ({
  streamSubtasks: vi.fn(),
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

function createStreamSubtask(
  overrides: {
    title?: string;
    description?: string;
  } = {}
) {
  return {
    type: 'subtask' as const,
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

  it('streams generated drafts through onSubtask', async () => {
    mockedStreamSubtasks.mockImplementation(async function* () {
      yield createStreamSubtask();

      yield {
        type: 'done',
      };
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(onSubtask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Write tests',
          description: 'Write unit tests',
        })
      );
    });

    expect(onSubtask).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('streams multiple generated drafts', async () => {
    mockedStreamSubtasks.mockImplementation(async function* () {
      yield createStreamSubtask({
        title: 'Write tests',
      });

      yield createStreamSubtask({
        title: 'Review tests',
      });

      yield {
        type: 'done',
      };
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

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
    mockedStreamSubtasks.mockImplementation(async function* () {
      yield createStreamSubtask({
        title: 'Write tests',
      });
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

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

  it('stores error after failed generation', async () => {
    const error = new AiUnavailableError('AI failed');

    mockedStreamSubtasks.mockImplementation(async function* () {
      throw error;
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
    });

    expect(onSubtask).not.toHaveBeenCalled();
  });

  it('does not call service when task id is missing', async () => {
    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('', onSubtask), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ValidationRequestError);
    });

    expect(mockedStreamSubtasks).not.toHaveBeenCalled();
    expect(onSubtask).not.toHaveBeenCalled();
  });

  it('clears error on discard', async () => {
    const error = new AiUnavailableError('AI failed');

    mockedStreamSubtasks.mockImplementation(async function* () {
      throw error;
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
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

  it('retries generation after failure', async () => {
    const error = new AiUnavailableError('Temporary failure');

    mockedStreamSubtasks
      .mockImplementationOnce(async function* () {
        throw error;
      })
      .mockImplementationOnce(async function* () {
        yield createStreamSubtask({
          title: 'Recovered draft',
        });

        yield {
          type: 'done',
        };
      });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
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
      .mockImplementationOnce(async function* () {
        throw error;
      })
      .mockImplementationOnce(async function* () {
        await new Promise(() => {});
      });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
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

  it('sets isGenerating while request is pending', async () => {
    let resolve!: () => void;

    mockedStreamSubtasks.mockImplementation(async function* () {
      await new Promise<void>((r) => {
        resolve = r;
      });

      yield {
        type: 'done',
      };
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
    });

    await act(async () => {
      resolve();
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });
  });

  it('aborts the active request when cancelled', async () => {
    let resolve!: () => void;
    let receivedSignal!: AbortSignal;

    mockedStreamSubtasks.mockImplementation(async function* (_taskId, signal) {
      receivedSignal = signal!;

      await new Promise<void>((r) => {
        resolve = r;
      });

      return;
    });

    const onSubtask = vi.fn();

    const { result } = renderHook(() => useSubtaskDrafts('task-1', onSubtask), {
      wrapper: createWrapper(),
    });

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
