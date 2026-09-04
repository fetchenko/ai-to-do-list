import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';

const mocks = vi.hoisted(() => ({
  acquireAiRequestLock: vi.fn(),
  createAiGenerationLog: vi.fn(),
  generationStream: vi.fn(),
  AiGeneration: vi.fn(),
  AiGenerationLog: vi.fn(),
  SubtaskGeneration: vi.fn(),
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
const lock = { release: vi.fn().mockResolvedValue(undefined) };
const generation = { stream: mocks.generationStream };

function createInput() {
  return {
    task,
    userId: 'user-1',
    provider: {} as AIProvider,
    signal,
  };
}

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.acquireAiRequestLock.mockResolvedValue(lock);
    mocks.createAiGenerationLog.mockResolvedValue('generation-1');
    mocks.AiGenerationLog.mockImplementation((id: string) => ({ id }));
    mocks.AiGeneration.mockImplementation(() => ({}));
    mocks.SubtaskGeneration.mockImplementation(() => generation);
    mocks.generationStream.mockReturnValue(stream);
  });

  it('creates the generation and returns its stream', async () => {
    const result = await streamSubtasksForTask(createInput());

    expect(mocks.acquireAiRequestLock).toHaveBeenCalledOnce();
    expect(mocks.acquireAiRequestLock).toHaveBeenCalledWith('user-1');
    expect(mocks.createAiGenerationLog).toHaveBeenCalledOnce();
    expect(mocks.createAiGenerationLog).toHaveBeenCalledWith({
      userId: 'user-1',
      taskId: 'task-1',
      feature: 'generate-subtasks',
    });
    expect(mocks.AiGenerationLog).toHaveBeenCalledWith('generation-1');
    expect(mocks.AiGeneration).toHaveBeenCalledWith(
      { id: 'generation-1' },
      lock
    );
    expect(mocks.SubtaskGeneration).toHaveBeenCalledWith({
      generation,
      task,
      provider: {},
      signal,
    });
    expect(mocks.generationStream).toHaveBeenCalledOnce();
    expect(result).toBe(stream);
    expect(lock.release).not.toHaveBeenCalled();
  });

  it('continues without a generation log when log creation returns null', async () => {
    mocks.createAiGenerationLog.mockResolvedValue(null);

    const result = await streamSubtasksForTask(createInput());

    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).toHaveBeenCalledWith(null, lock);
    expect(result).toBe(stream);
    expect(lock.release).not.toHaveBeenCalled();
  });

  it('continues without a generation log when log creation fails', async () => {
    const error = new Error('log creation failed');
    mocks.createAiGenerationLog.mockRejectedValue(error);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await streamSubtasksForTask(createInput());

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to create AI generation log',
      error
    );
    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).toHaveBeenCalledWith(null, lock);
    expect(result).toBe(stream);
    expect(lock.release).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('propagates lock acquisition errors', async () => {
    const error = new Error('lock acquisition failed');
    mocks.acquireAiRequestLock.mockRejectedValue(error);

    await expect(streamSubtasksForTask(createInput())).rejects.toBe(error);

    expect(mocks.createAiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.AiGeneration).not.toHaveBeenCalled();
    expect(mocks.SubtaskGeneration).not.toHaveBeenCalled();
  });
});
