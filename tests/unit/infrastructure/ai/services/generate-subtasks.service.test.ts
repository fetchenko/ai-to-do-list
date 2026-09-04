import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { generateSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';

const mocks = vi.hoisted(() => ({
  acquireAiRequestLock: vi.fn(),
  createAiGenerationLog: vi.fn(),
  AiGeneration: vi.fn(),
  AiGenerationLog: vi.fn(),
}));

vi.mock('@/infrastructure/ai/generations/ai-generation-lock', () => ({
  acquireAiRequestLock: mocks.acquireAiRequestLock,
}));
vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiGenerationLog: mocks.createAiGenerationLog,
}));
vi.mock('@/infrastructure/ai/generations/ai-generation', () => ({
  AiGenerationResource: mocks.AiGeneration,
}));
vi.mock('@/infrastructure/ai/generations/ai-generation-log', () => ({
  AiGenerationLogResource: mocks.AiGenerationLog,
}));

const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };
const signal = new AbortController().signal;
const lock = {
  release: vi.fn().mockResolvedValue(undefined),
} satisfies AiRequestLock;
const provider = {
  quotaLimit: undefined,
  generate: vi.fn(),
  stream: vi.fn(),
} satisfies AIProvider;

function setupGeneration() {
  const complete = vi.fn().mockResolvedValue(undefined);
  const fail = vi.fn().mockResolvedValue(undefined);
  const cancel = vi.fn().mockResolvedValue(undefined);

  mocks.AiGeneration.mockImplementation(
    class AiGenerationMock {
      complete = complete;
      fail = fail;
      cancel = cancel;
    }
  );

  return { complete, fail, cancel };
}

describe('generateSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireAiRequestLock.mockResolvedValue(lock);
    mocks.createAiGenerationLog.mockResolvedValue('generation-1');
    mocks.AiGenerationLog.mockImplementation(
      class AiGenerationLogMock {
        constructor(readonly id: string) {}
      }
    );
  });

  it('completes the generation with provider metadata on success', async () => {
    const { complete, fail } = setupGeneration();
    const metadata = {
      model: 'test',
      response: '[{"title":"Book hotel"}]',
      finishReason: 'tool_calls',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    };
    provider.generate.mockResolvedValue({
      data: { subtasks: [{ id: 'subtask-1', title: 'Book hotel' }] },
      metadata,
    });

    const result = await generateSubtasksForTask({
      task,
      userId: 'user-1',
      signal,
      provider,
    });

    expect(result).toEqual({
      data: { subtasks: [{ id: 'subtask-1', title: 'Book hotel' }] },
    });
    expect(complete).toHaveBeenCalledWith({ metadata });
    expect(fail).not.toHaveBeenCalled();
    expect(lock.release).not.toHaveBeenCalled();
  });

  it('fails the generation and releases the lock when the provider fails', async () => {
    const { fail } = setupGeneration();
    const error = new Error('provider failed');
    provider.generate.mockRejectedValue(error);

    await expect(
      generateSubtasksForTask({ task, userId: 'user-1', signal, provider })
    ).rejects.toBe(error);

    expect(fail).toHaveBeenCalledWith({ code: 'AI_GENERATION_FAILED' });
  });

  it('continues without a generation log when log creation fails', async () => {
    const { complete } = setupGeneration();
    const error = new Error('log creation failed');
    mocks.createAiGenerationLog.mockRejectedValue(error);
    provider.generate.mockResolvedValue({
      data: { subtasks: [] },
      metadata: {} as never,
    });
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    try {
      await generateSubtasksForTask({
        task,
        userId: 'user-1',
        signal,
        provider,
      });

      expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
      expect(complete).toHaveBeenCalledWith({ metadata: {} });
      expect(lock.release).not.toHaveBeenCalled();
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
      generateSubtasksForTask({ task, userId: 'user-1', signal, provider })
    ).rejects.toBe(error);

    expect(mocks.createAiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).not.toHaveBeenCalled();
  });
});
