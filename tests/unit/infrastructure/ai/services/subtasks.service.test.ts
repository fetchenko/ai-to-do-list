import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startSubtaskGeneration } from '@/infrastructure/ai/generations/start-subtask-generation';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';

vi.mock('@/infrastructure/ai/generations/start-subtask-generation', () => ({
  startSubtaskGeneration: vi.fn(),
}));

const mockedStartSubtaskGeneration = vi.mocked(startSubtaskGeneration);

const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };
const signal = new AbortController().signal;

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts a subtask generation and returns its stream', async () => {
    const stream = new ReadableStream<Uint8Array>();
    const generation = {
      stream: vi.fn().mockReturnValue(stream),
    };

    mockedStartSubtaskGeneration.mockResolvedValue(generation);

    const input = {
      task,
      userId: 'user-1',
      provider: {} as AIProvider,
      signal,
    };

    const result = await streamSubtasksForTask(input);

    expect(mockedStartSubtaskGeneration).toHaveBeenCalledWith(input);
    expect(generation.stream).toHaveBeenCalledOnce();
    expect(result).toBe(stream);
  });
});
