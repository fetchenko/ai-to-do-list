import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSubtaskDraftsStream } from '@/features/tasks/hooks/use-subtask-drafts-stream';
import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import type { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';
import { AiUnavailableError } from '@/shared/errors/app-error';

vi.mock('@/features/tasks/services/subtasks.service', () => ({
  streamSubtasks: vi.fn(),
}));

vi.mock('@/shared/react-query/ai-retry', () => ({
  shouldRetry: () => false,
  retryDelay: () => 0,
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
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

function createStream(chunks: AiStreamChunk[]): AsyncIterable<AiStreamChunk> {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

describe('useSubtaskDraftsStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends streamed subtasks and marks generation complete after the stream ends', async () => {
    mockedStreamSubtasks.mockReturnValue(
      createStream([
        {
          type: 'subtask',
          subtask: {
            title: 'Research phones',
            description: 'Compare available options',
          },
        },
        {
          type: 'subtask',
          subtask: {
            title: 'Compare prices',
            description: 'Check several retailers',
          },
        },
        {
          type: 'done',
          metadata: {} as never,
        },
      ])
    );

    const { result } = renderHook(() => useSubtaskDraftsStream('task-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.drafts).toEqual([
        expect.objectContaining({
          title: 'Research phones',
          description: 'Compare available options',
        }),
        expect.objectContaining({
          title: 'Compare prices',
          description: 'Check several retailers',
        }),
      ]);
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isGenerated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    expect(mockedStreamSubtasks).toHaveBeenCalledWith('task-1');
  });

  it('remains generating while the stream is pending', async () => {
    let resolve!: () => void;

    mockedStreamSubtasks.mockReturnValue(
      (async function* () {
        await new Promise<void>((r) => {
          resolve = r;
        });

        yield {
          type: 'subtask',
          subtask: { title: 'Draft' },
        };
      })()
    );

    const { result } = renderHook(() => useSubtaskDraftsStream('task-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(true);
      expect(result.current.isGenerated).toBe(false);
    });

    await act(async () => {
      resolve();
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isGenerated).toBe(true);
      expect(result.current.drafts).toHaveLength(1);
    });
  });

  it('clears drafts and resets mutation state on discard', async () => {
    mockedStreamSubtasks.mockReturnValue(
      createStream([
        {
          type: 'subtask',
          subtask: { title: 'Draft' },
        },
      ])
    );

    const { result } = renderHook(() => useSubtaskDraftsStream('task-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.isGenerated).toBe(true);
    });

    act(() => {
      result.current.discard();
    });

    expect(result.current.drafts).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isGenerated).toBe(false);
  });

  it('clears previous drafts before starting a new generation', async () => {
    mockedStreamSubtasks
      .mockReturnValueOnce(
        createStream([
          {
            type: 'subtask',
            subtask: { title: 'First draft' },
          },
        ])
      )
      .mockReturnValueOnce(
        createStream([
          {
            type: 'subtask',
            subtask: { title: 'Second draft' },
          },
        ])
      );

    const { result } = renderHook(() => useSubtaskDraftsStream('task-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.drafts).toEqual([
        expect.objectContaining({ title: 'First draft' }),
      ]);
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.drafts).toEqual([
        expect.objectContaining({ title: 'Second draft' }),
      ]);
    });
  });

  it('stores the stream error and clears drafts when generation fails', async () => {
    const error = new AiUnavailableError('AI failed');
    mockedStreamSubtasks.mockImplementation(() => {
      return (async function* () {
        throw error;
      })();
    });

    const { result } = renderHook(() => useSubtaskDraftsStream('task-1'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.error).toEqual(error);
      expect(result.current.drafts).toBeNull();
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.isGenerated).toBe(false);
    });
  });

  it('does not call the service when task id is missing', async () => {
    const { result } = renderHook(() => useSubtaskDraftsStream(''), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.generate();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(mockedStreamSubtasks).not.toHaveBeenCalled();
  });
});
