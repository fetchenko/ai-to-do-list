import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/tasks/[taskId]/subtasks/generate/route';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskForUser: vi.fn(),
  generateSubtasksForTask: vi.fn(),

  checkAiQuotaLimit: vi.fn(),
  checkRequestLock: vi.fn(),
  releaseRequestLock: vi.fn(),
  updateAiLog: vi.fn(),

  parseAiParams: vi.fn(),
  getFailedAiLogs: vi.fn(),
  normalizeAiError: vi.fn(),
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
  checkAiQuotaLimit: mocks.checkAiQuotaLimit,
  checkRequestLock: mocks.checkRequestLock,
  releaseRequestLock: mocks.releaseRequestLock,
  updateAiLog: mocks.updateAiLog,
}));

vi.mock('@/infrastructure/ai/helpers/ai-log.utils', () => ({
  getFailedAiLogs: mocks.getFailedAiLogs,
}));

vi.mock('@/infrastructure/ai/helpers/ai-error.utils', () => ({
  normalizeAiError: mocks.normalizeAiError,
}));

vi.mock('@/infrastructure/ai/helpers/ai-params.utils', () => ({
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

    expect(response.status).toBe(502);

    const body = await response.json();

    expect(body).toEqual({
      error: {
        code: 'AI_GENERATION_FAILED',
        success: false,
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
});
