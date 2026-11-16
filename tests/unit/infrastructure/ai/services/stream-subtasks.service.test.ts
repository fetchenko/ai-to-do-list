import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';
import { subtaskToolSchema } from '@/infrastructure/ai/schema/subtask-tool.schema';

const mocks = vi.hoisted(() => ({
  acquireAiRequestLock: vi.fn(),
  createAiGenerationLog: vi.fn(),
  AiGenerationLog: vi.fn(function AiGenerationLogMock() {}),
  StreamGeneration: vi.fn(function StreamGenerationMock() {
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

vi.mock('@/infrastructure/ai/generations/ai-generation-log', () => ({
  AiGenerationLogResource: mocks.AiGenerationLog,
}));

vi.mock('@/infrastructure/ai/generations/stream-generation', () => ({
  StreamGenerationResource: mocks.StreamGeneration,
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

    mocks.AiGenerationLog.mockImplementation(function AiGenerationLogMock() {});

    mocks.StreamGeneration.mockImplementation(function StreamGenerationMock() {
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

    expect(mocks.StreamGeneration).toHaveBeenCalledWith({
      prompt: taskDecomposerStreamPrompt(task.title),
      tools: [createSubtaskTool],
      toolsEventSchema: subtaskToolSchema,
      provider: input.provider,
      signal,
      generationLog: expect.anything(),
      generationLock: lock,
    });

    expect(result).toBe(stream);
  });

  it('continues without a generation log when log creation returns null', async () => {
    mocks.createAiGenerationLog.mockResolvedValue(null);

    const result = await streamSubtasksForTask(input);

    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();

    expect(mocks.StreamGeneration).toHaveBeenCalledWith({
      prompt: taskDecomposerStreamPrompt(task.title),
      tools: [createSubtaskTool],
      toolsEventSchema: subtaskToolSchema,
      provider: input.provider,
      signal,
      generationLog: null,
      generationLock: lock,
    });

    expect(result).toBe(stream);
  });

  it('continues without a generation log when log creation fails', async () => {
    const error = new Error('log creation failed');

    mocks.createAiGenerationLog.mockRejectedValue(error);

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await streamSubtasksForTask(input);

    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();

    expect(mocks.StreamGeneration).toHaveBeenCalledWith({
      prompt: taskDecomposerStreamPrompt(task.title),
      tools: [createSubtaskTool],
      toolsEventSchema: subtaskToolSchema,
      provider: input.provider,
      signal,
      generationLog: null,
      generationLock: lock,
    });

    expect(result).toBe(stream);

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
    expect(mocks.AiGenerationLog).not.toHaveBeenCalled();
    expect(mocks.StreamGeneration).not.toHaveBeenCalled();
  });
});
