import { describe, expect, it, vi } from 'vitest';

import { streamSubtasksForTask } from '@/features/tasks/services/subtasks-generation.server.service';
import { streamAiGeneration } from '@/infrastructure/ai/services/ai-generation.service';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';

vi.mock('@/infrastructure/ai/services/ai-generation.service', () => ({
  streamAiGeneration: vi.fn(),
}));

const mockedStreamAiGeneration = vi.mocked(streamAiGeneration);
const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };
const signal = new AbortController().signal;
const provider = {} as AIProvider;

describe('streamSubtasksForTask', () => {
  it('configures generic AI generation with the task feature prompt and tool', () => {
    const stream = new ReadableStream<Uint8Array>();
    mockedStreamAiGeneration.mockReturnValue(Promise.resolve(stream));

    const result = streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
      signal,
    });

    expect(mockedStreamAiGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        taskId: 'task-1',
        feature: 'generate-subtasks',
        prompt: expect.stringContaining('Plan a trip'),
        tool: expect.objectContaining({
          name: 'generate_item',
          parameters: expect.objectContaining({
            required: ['data', 'description'],
          }),
        }),
        provider,
        signal,
      })
    );
    expect(result).toBeInstanceOf(Promise);
  });
});
