import { describe, expect, it, vi } from 'vitest';

import { tryCreateAiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { createAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiGenerationLog: vi.fn(),
}));

const mockedCreateAiGenerationLog = vi.mocked(createAiGenerationLog);
const input = {
  userId: 'user-1',
  taskId: 'task-1',
  feature: 'generate-subtasks',
};

describe('tryCreateAiGenerationLog', () => {
  it('returns a log resource when creation succeeds', async () => {
    mockedCreateAiGenerationLog.mockResolvedValue('log-1');

    const result = await tryCreateAiGenerationLog(input);

    expect(mockedCreateAiGenerationLog).toHaveBeenCalledWith(input);
    expect(result?.id).toBe('log-1');
  });

  it('returns null when the log service returns no id', async () => {
    mockedCreateAiGenerationLog.mockResolvedValue(null);

    await expect(tryCreateAiGenerationLog(input)).resolves.toBeNull();
  });

  it('returns null when log creation fails', async () => {
    mockedCreateAiGenerationLog.mockRejectedValueOnce(new Error('database failed'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(tryCreateAiGenerationLog(input)).resolves.toBeNull();
    } finally {
      consoleError.mockRestore();
    }

    expect(consoleError).toHaveBeenCalledOnce();
  });
});
