import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/subtasks/generate/route';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskForUser: vi.fn(),
  generateSubtasksForTask: vi.fn(),

  checkAiQuotaLimit: vi.fn(),
  checkRequestLock: vi.fn(),
  releaseRequestLock: vi.fn(),
  updateAiLog: vi.fn(),

  parseAiRequest: vi.fn(),
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

vi.mock('@/infrastructure/ai/helpers/ai.helpers', () => ({
  parseAiRequest: mocks.parseAiRequest,
  getFailedAiLogs: mocks.getFailedAiLogs,
  normalizeAiError: mocks.normalizeAiError,
}));

describe('POST /api/subtasks/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getCurrentUser.mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });

    mocks.checkRequestLock.mockResolvedValue(undefined);

    mocks.checkAiQuotaLimit.mockResolvedValue(undefined);

    mocks.parseAiRequest.mockResolvedValue({
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

    const request = new Request('http://localhost/api/subtasks/generate', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task-1',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);

    const body = await response.json();

    expect(body).toEqual({
      error: {
        message: 'AI unavailable',
        code: 'AI_GENERATION_FAILED',
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

    const request = new Request('http://localhost/api/subtasks/generate', {
      method: 'POST',
      body: JSON.stringify({
        taskId: 'task-1',
      }),
    });

    const response = await POST(request);

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
