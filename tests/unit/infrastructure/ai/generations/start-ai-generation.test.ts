import { beforeEach, describe, expect, it, vi } from 'vitest';

import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-request-lock';
import { startAiGeneration } from '@/infrastructure/ai/generations/start-ai-generation';
import { tryCreateAiGenerationLog } from '@/infrastructure/ai/generations/try-create-ai-generation-log';

vi.mock('@/infrastructure/ai/generations/try-create-ai-generation-log', () => ({
  tryCreateAiGenerationLog: vi.fn(),
}));

vi.mock('@/infrastructure/ai/generations/ai-request-lock', () => ({
  acquireAiRequestLock: vi.fn(),
}));

const mockedTryCreateAiGenerationLog = vi.mocked(tryCreateAiGenerationLog);
const mockedAcquireAiRequestLock = vi.mocked(acquireAiRequestLock);

const input = {
  userId: 'user-1',
  taskId: 'task-1',
  feature: 'generate-subtasks',
};

describe('startAiGeneration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('acquires the lock and creates an optional log', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const lock = { release };
    const log = {
      id: 'log-1',
      complete: vi.fn(),
      fail: vi.fn(),
      cancel: vi.fn(),
    };
    mockedAcquireAiRequestLock.mockResolvedValue(lock);
    mockedTryCreateAiGenerationLog.mockResolvedValue(log);

    const generation = await startAiGeneration(input);

    expect(mockedAcquireAiRequestLock).toHaveBeenCalledWith('user-1');
    expect(mockedTryCreateAiGenerationLog).toHaveBeenCalledWith(input);
    expect(generation.id).toBe('log-1');
    expect(release).not.toHaveBeenCalled();
  });

  it('starts the generation when log creation is unavailable', async () => {
    mockedAcquireAiRequestLock.mockResolvedValue({ release: vi.fn() });
    mockedTryCreateAiGenerationLog.mockResolvedValue(null);

    const generation = await startAiGeneration(input);

    expect(generation.id).toBeNull();
  });

  it('does not create a log when lock acquisition fails', async () => {
    const error = new Error('lock acquisition failed');
    mockedAcquireAiRequestLock.mockRejectedValue(error);

    await expect(startAiGeneration(input)).rejects.toBe(error);
    expect(mockedTryCreateAiGenerationLog).not.toHaveBeenCalled();
  });
});
