import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';

vi.mock('@/features/tasks/services/subtasks.service', () => ({
  generateSubtasks: vi.fn(),
}));

const mockedGenerateSubtasks = vi.mocked(generateSubtasks);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({
    children,
  }: {
    children: ReactNode;
  }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe('useSubtaskDrafts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  it('returns generated drafts on success', async () => {
    const drafts = [
      {
        id: '1',
        title: 'Write tests',
      },
    ];

    mockedGenerateSubtasks.mockResolvedValue(drafts as AiTask[]);

    const { result } = renderHook(
      () => useSubtaskDrafts('task-1'),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.drafts)
        .toEqual(drafts);
    });


    expect(result.current.error)
      .toBeNull();
  });


  it('stores error after failed generation', async () => {
    const error = new Error('AI failed');

    mockedGenerateSubtasks.mockRejectedValue(error);


    const { result } = renderHook(
      () => useSubtaskDrafts('task-1'),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.error)
        .toEqual(error);
    });


    expect(result.current.drafts)
      .toBeNull();
  });


  it('clears error after successful retry', async () => {
    mockedGenerateSubtasks
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'Retry success',
        },
      ] as AiTask[]);


    const { result } = renderHook(
      () => useSubtaskDrafts('task-1'),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.error)
        .not
        .toBeNull();
    });


    act(async () => {
      result.current.retry();
    });


    await waitFor(() => {
      expect(result.current.error)
        .toBeNull();
    });


    expect(result.current.drafts)
      .toHaveLength(1);
  });


  it('clears drafts and errors on discard', async () => {
    mockedGenerateSubtasks.mockResolvedValue([
      {
        id: '1',
        title: 'Draft',
      },
    ] as AiTask[]);


    const { result } = renderHook(
      () => useSubtaskDrafts('task-1'),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.drafts)
        .not
        .toBeNull();
    });


    act(() => {
      result.current.discard();
    });


    expect(result.current.drafts)
      .toBeNull();

    expect(result.current.error)
      .toBeNull();
  });


  it('does not call service when task id is missing', async () => {
    const { result } = renderHook(
      () => useSubtaskDrafts(''),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.error)
        .not
        .toBeNull();
    });


    expect(mockedGenerateSubtasks)
      .not
      .toHaveBeenCalled();
  });

  it('retries generation after failure', async () => {
    mockedGenerateSubtasks
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce([
        {
          id: '1',
          title: 'Recovered draft',
        },
      ] as AiTask[]);


    const { result } = renderHook(
      () => useSubtaskDrafts('task-1'),
      {
        wrapper: createWrapper(),
      },
    );


    act(() => {
      result.current.generate();
    });


    await waitFor(() => {
      expect(result.current.error)
        .not
        .toBeNull();
    });


    act(() => {
      result.current.retry();
    });


    await waitFor(() => {
      expect(result.current.drafts)
        .toHaveLength(1);
    });


    expect(result.current.error)
      .toBeNull();


    expect(mockedGenerateSubtasks)
      .toHaveBeenCalledTimes(2);
  });
});
