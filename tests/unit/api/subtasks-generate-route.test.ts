import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/tasks/[taskId]/subtasks/generate/route';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskForUser: vi.fn(),
  getAIProvider: vi.fn(),
  generateSubtasksForTask: vi.fn(),

  checkAiQuotaLimit: vi.fn(),
  checkRequestLock: vi.fn(),
  releaseRequestLock: vi.fn(),
  updateAiLog: vi.fn(),

  parseAiParams: vi.fn(),
  getFailedAiLogs: vi.fn(),
  normalizeAiError: vi.fn(),
}));

vi.mock('@/infrastructure/ai/providers/ai-provider', () => ({
  getAIProvider: mocks.getAIProvider,
}));

vi.mock('@/features/auth/repository/auth.server.repository', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/features/tasks/repository/tasks.admin.repository', () => ({
  getTaskForUser: mocks.getTaskForUser,
}));

vi.mock('@/infrastructure/ai/services/subtasks.service', () => ({
  generateSubtasksForTask: mocks.generateSubtasksForTask,
}));

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  updateAiLog: mocks.updateAiLog,
}));

vi.mock('@/infrastructure/ai/services/ai-quota-limit.admin.service', () => ({
  checkAiQuotaLimit: mocks.checkAiQuotaLimit,
}));

vi.mock('@/infrastructure/ai/services/ai-lock.admin.service', () => ({
  checkRequestLock: mocks.checkRequestLock,
  releaseRequestLock: mocks.releaseRequestLock,
}));

vi.mock('@/infrastructure/ai/utils/ai-log.utils', () => ({
  getFailedAiLogs: mocks.getFailedAiLogs,
}));

vi.mock('@/infrastructure/ai/utils/ai-error.utils', () => ({
  normalizeAiError: mocks.normalizeAiError,
}));

vi.mock('@/infrastructure/ai/utils/ai-params.utils', () => ({
  parseAiParams: mocks.parseAiParams,
}));

describe('POST /api/tasks/[taskId]/subtasks/generate/route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getCurrentUser.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });

    mocks.getAIProvider.mockReturnValue({
      quotaLimit: 20,
    });

    mocks.checkRequestLock.mockResolvedValue(undefined);

    mocks.checkAiQuotaLimit.mockResolvedValue(undefined);

    mocks.parseAiParams.mockResolvedValue({
      taskId: 'task-1',
    });

    mocks.getTaskForUser.mockResolvedValue({
      id: 'task-1',
      title: 'Test task',
    });

    mocks.normalizeAiError.mockImplementation((error: Error) => ({
      status: 500,
      message: error.message,
      code: 'AI_GENERATION_FAILED',
    }));
  });

  it('returns errors in a consistent shape', async () => {
    mocks.generateSubtasksForTask.mockRejectedValue(
      new Error('AI unavailable')
    );

    const request = new Request(
      'http://localhost/api/tasks/9d3f8e2a-4b1c-4a5e-8f6d-1a2b3c4d5e6f/subtasks/generate',
      { method: 'POST' }
    );

    const response = await POST(request, {
      params: Promise.resolve({
        taskId: '9d3f8e2a-4b1c-4a5e-8f6d-1a2b3c4d5e6f',
      }),
    });

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: {
        code: 'AI_GENERATION_FAILED',
        message: 'AI unavailable',
      },
    });
  });

  it('returns generated subtasks on success', async () => {
    mocks.generateSubtasksForTask.mockResolvedValue({
      aiLogId: 'log-1',
      data: {
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Write tests',
          },
        ],
      },
    });

    const request = new Request(
      'http://localhost/api/tasks/9d3f8e2a-4b1c-4a5e-8f6d-1a2b3c4d5e6f/subtasks/generate',
      { method: 'POST' }
    );

    const response = await POST(request, {
      params: Promise.resolve({
        taskId: '9d3f8e2a-4b1c-4a5e-8f6d-1a2b3c4d5e6f',
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual({
      success: true,
      data: {
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Write tests',
          },
        ],
      },
    });
  });

  it('checks the quota when the provider has a quota limit', async () => {
    mocks.getAIProvider.mockReturnValue({
      quotaLimit: 20,
    });

    mocks.generateSubtasksForTask.mockResolvedValue({
      aiLogId: 'log-1',
      data: {
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Write tests',
          },
        ],
      },
    });

    const request = new Request(
      'http://localhost/api/tasks/task-1/subtasks/generate',
      { method: 'POST' }
    );

    const response = await POST(request, {
      params: Promise.resolve({
        taskId: 'task-1',
      }),
    });

    expect(response.status).toBe(200);

    expect(mocks.getAIProvider).toHaveBeenCalled();
    expect(mocks.checkAiQuotaLimit).toHaveBeenCalledWith('user-1', 20);
  });

  it('does not check the quota when the provider has no quota limit', async () => {
    mocks.getAIProvider.mockReturnValue({
      quotaLimit: undefined,
    });

    mocks.generateSubtasksForTask.mockResolvedValue({
      aiLogId: 'log-1',
      data: {
        subtasks: [
          {
            id: 'subtask-1',
            title: 'Write tests',
          },
        ],
      },
    });

    const request = new Request(
      'http://localhost/api/tasks/task-1/subtasks/generate',
      { method: 'POST' }
    );

    const response = await POST(request, {
      params: Promise.resolve({
        taskId: 'task-1',
      }),
    });

    expect(response.status).toBe(200);

    expect(mocks.checkAiQuotaLimit).not.toHaveBeenCalled();
  });
});
