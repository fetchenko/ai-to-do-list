import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';

const mocks = vi.hoisted(() => ({
  acquireAiRequestLock: vi.fn(),
  createAiGenerationLog: vi.fn(),
  AiGeneration: vi.fn(function AiGenerationMock() {}),
  AiGenerationLog: vi.fn(function AiGenerationLogMock() {}),
  SubtaskGeneration: vi.fn(function SubtaskGenerationMock() {
    return {
      stream: vi.fn(),
    };
  }),
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

vi.mock('@/infrastructure/ai/generations/subtask-generation', () => ({
  SubtaskGenerationResource: mocks.SubtaskGeneration,
}));

const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };
const signal = new AbortController().signal;
const stream = new ReadableStream<Uint8Array>();
const lock = {
  release: vi.fn().mockResolvedValue(undefined),
} satisfies AiRequestLock;

const input = {
  task,
  userId: 'user-1',
  provider: {} as AIProvider,
  signal,
};

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireAiRequestLock.mockResolvedValue(lock);
    mocks.createAiGenerationLog.mockResolvedValue('generation-1');
    mocks.AiGeneration.mockImplementation(function AiGenerationMock() {});
    mocks.AiGenerationLog.mockImplementation(function AiGenerationLogMock() {});
    mocks.SubtaskGeneration.mockImplementation(function SubtaskGenerationMock() {
      return {
        stream: vi.fn().mockReturnValue(stream),
      };
    });
  });

  it('creates the generation and returns its stream', async () => {
    const result = await streamSubtasksForTask(input);

    expect(mocks.acquireAiRequestLock).toHaveBeenCalledWith('user-1');
    expect(mocks.createAiGenerationLog).toHaveBeenCalledWith({
      userId: 'user-1',
      taskId: 'task-1',
      feature: 'generate-subtasks',
    });
    expect(mocks.AiGenerationLog).toHaveBeenCalledWith('generation-1');
    expect(mocks.AiGeneration).toHaveBeenCalledWith(
      expect.anything(),
      lock
    );
    expect(mocks.SubtaskGeneration).toHaveBeenCalledWith({
      generation: expect.anything(),
      task,
      provider: input.provider,
      signal,
    });
    expect(result).toBe(stream);
  });

  it('continues without a generation log when log creation returns null', async () => {
    mocks.createAiGenerationLog.mockResolvedValue(null);

    const result = await streamSubtasksForTask(input);

    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).toHaveBeenCalledWith(null, lock);
    expect(mocks.SubtaskGeneration).toHaveBeenCalled();
    expect(result).toBe(stream);
    expect(lock.release).not.toHaveBeenCalled();
  });

  it('continues without a generation log when log creation fails', async () => {
    const error = new Error('log creation failed');
    mocks.createAiGenerationLog.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await streamSubtasksForTask(input);

    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).toHaveBeenCalledWith(null, lock);
    expect(mocks.SubtaskGeneration).toHaveBeenCalled();
    expect(result).toBe(stream);
    expect(lock.release).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create AI generation log',
      error
    );

    consoleError.mockRestore();
  });

  it('propagates lock acquisition failures', async () => {
    const error = new Error('lock acquisition failed');
    mocks.acquireAiRequestLock.mockRejectedValue(error);

    await expect(streamSubtasksForTask(input)).rejects.toBe(error);

    expect(mocks.createAiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).not.toHaveBeenCalled();
    expect(mocks.SubtaskGeneration).not.toHaveBeenCalled();
  });
});
