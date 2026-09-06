import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { generateSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';

const mocks = vi.hoisted(() => ({
  acquireAiRequestLock: vi.fn(),
  createAiGenerationLog: vi.fn(),
  completeAiGenerationLog: vi.fn(),
  failAiGenerationLog: vi.fn(),
}));

vi.mock('@/infrastructure/ai/generations/ai-generation-lock', () => ({
  acquireAiRequestLock: mocks.acquireAiRequestLock,
}));

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiGenerationLog: mocks.createAiGenerationLog,
  completeAiGenerationLog: mocks.completeAiGenerationLog,
  failAiGenerationLog: mocks.failAiGenerationLog,
}));

const task = {
  user_id: 'user-id',
  id: 'task-1',
  title: 'Plan a trip',
};

const signal = new AbortController().signal;

const lock = {
  release: vi.fn().mockResolvedValue(undefined),
} satisfies AiRequestLock;

const provider = {
  quotaLimit: undefined,
  generate: vi.fn(),
  stream: vi.fn(),
} satisfies AIProvider;

describe('generateSubtasksForTask', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mocks.acquireAiRequestLock.mockResolvedValue(lock);
    mocks.createAiGenerationLog.mockResolvedValue('generation-1');
    mocks.completeAiGenerationLog.mockResolvedValue(undefined);
    mocks.failAiGenerationLog.mockResolvedValue(undefined);

    lock.release.mockResolvedValue(undefined);
  });

  it('completes the generation with provider metadata on success', async () => {
    const metadata = {
      model: 'test',
      response: '[{"title":"Book hotel"}]',
      finishReason: 'tool_calls',
      usage: {
        inputTokens: 1,
        outputTokens: 2,
        totalTokens: 3,
      },
    };

    provider.generate.mockResolvedValue({
      data: {
        subtasks: [{ id: 'subtask-1', title: 'Book hotel' }],
      },
      metadata,
    });

    const result = await generateSubtasksForTask({
      task,
      userId: 'user-1',
      signal,
      provider,
    });

    expect(result).toEqual({
      data: {
        subtasks: [{ id: 'subtask-1', title: 'Book hotel' }],
      },
    });

    expect(mocks.createAiGenerationLog).toHaveBeenCalledWith({
      userId: 'user-1',
      taskId: 'task-1',
      feature: 'generate-subtasks',
    });

    expect(mocks.completeAiGenerationLog).toHaveBeenCalledWith({
      id: 'generation-1',
      metadata,
    });

    expect(mocks.failAiGenerationLog).not.toHaveBeenCalled();
    expect(lock.release).toHaveBeenCalledTimes(1);
  });

  it('fails the generation and releases the lock when the provider fails', async () => {
    const error = new Error('provider failed');

    provider.generate.mockRejectedValue(error);

    await expect(
      generateSubtasksForTask({
        task,
        userId: 'user-1',
        signal,
        provider,
      })
    ).rejects.toBe(error);

    expect(mocks.failAiGenerationLog).toHaveBeenCalledWith({
      id: 'generation-1',
      errorCode: 'AI_GENERATION_FAILED',
    });

    expect(mocks.completeAiGenerationLog).not.toHaveBeenCalled();
    expect(lock.release).toHaveBeenCalledTimes(1);
  });

  it('continues without a generation log when log creation fails', async () => {
    const error = new Error('log creation failed');

    mocks.createAiGenerationLog.mockRejectedValue(error);

    provider.generate.mockResolvedValue({
      data: {
        subtasks: [],
      },
      metadata: {} as never,
    });

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      const result = await generateSubtasksForTask({
        task,
        userId: 'user-1',
        signal,
        provider,
      });

      expect(result).toEqual({
        data: {
          subtasks: [],
        },
      });

      expect(mocks.completeAiGenerationLog).not.toHaveBeenCalled();
      expect(mocks.failAiGenerationLog).not.toHaveBeenCalled();
      expect(lock.release).toHaveBeenCalledTimes(1);

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to create AI generation log',
        error
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it('propagates lock acquisition failures without creating a generation', async () => {
    const error = new Error('lock failed');

    mocks.acquireAiRequestLock.mockRejectedValue(error);

    await expect(
      generateSubtasksForTask({
        task,
        userId: 'user-1',
        signal,
        provider,
      })
    ).rejects.toBe(error);

    expect(mocks.createAiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.completeAiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.failAiGenerationLog).not.toHaveBeenCalled();
    expect(lock.release).not.toHaveBeenCalled();
  });
});
