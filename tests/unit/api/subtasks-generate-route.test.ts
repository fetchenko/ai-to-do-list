import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/tasks/[taskId]/subtasks/generate/route';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskForUser: vi.fn(),
  prepareSubtasksStream: vi.fn(),

  checkAiQuotaLimit: vi.fn(),
  checkRequestLock: vi.fn(),
  releaseRequestLock: vi.fn(),
  updateAiLog: vi.fn(),

  parseAiParams: vi.fn(),
  getFailedAiLogs: vi.fn(),
  getSuccessAiLogs: vi.fn(),
  normalizeAiError: vi.fn(),
}));

vi.mock('@/features/auth/repository/auth.server.repository', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/features/tasks/repository/tasks.admin.repository', () => ({
  getTaskForUser: mocks.getTaskForUser,
}));

vi.mock('@/infrastructure/ai/services/subtasks.service', () => ({
  prepareSubtasksStream: mocks.prepareSubtasksStream,
}));

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  checkAiQuotaLimit: mocks.checkAiQuotaLimit,
  checkRequestLock: mocks.checkRequestLock,
  releaseRequestLock: mocks.releaseRequestLock,
  updateAiLog: mocks.updateAiLog,
}));

vi.mock('@/infrastructure/ai/utils/ai-log.utils', () => ({
  getFailedAiLogs: mocks.getFailedAiLogs,
  getSuccessAiLogs: mocks.getSuccessAiLogs,
}));

vi.mock('@/infrastructure/ai/utils/ai-error.utils', () => ({
  normalizeAiError: mocks.normalizeAiError,
}));

vi.mock('@/infrastructure/ai/utils/ai-params.utils', () => ({
  parseAiParams: mocks.parseAiParams,
}));

async function* streamEvents(events: unknown[]) {
  for (const event of events) {
    yield event;
  }
}

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

    mocks.getSuccessAiLogs.mockReturnValue({ status: 'success' });

    mocks.normalizeAiError.mockImplementation((error: Error) => ({
      status: 500,
      message: error.message,
      code: 'AI_GENERATION_FAILED',
    }));
  });

  it('returns errors in a consistent shape', async () => {
    mocks.prepareSubtasksStream.mockRejectedValue(
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

  it('streams generated subtasks and completes successfully', async () => {
    mocks.prepareSubtasksStream.mockResolvedValue({
      aiLogId: 'log-1',
      stream: streamEvents([
        {
          type: 'content',
          content: '{"subtasks":[{"title":"Write tests"}]}',
        },
        {
          type: 'complete',
          response: {
            data: {
              subtasks: [{ title: 'Write tests' }],
            },
            aiLogs: {
              model: 'test-model',
              response: '{"subtasks":[{"title":"Write tests"}]}',
              input_tokens: 1,
              output_tokens: 2,
              total_tokens: 3,
            },
            raw: '{}',
          },
        },
      ]),
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
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');

    const text = await response.text();
    const events = text
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

    expect(events).toEqual([
      {
        type: 'subtask',
        subtask: { title: 'Write tests' },
      },
      { type: 'done' },
    ]);

    expect(mocks.updateAiLog).toHaveBeenCalledWith(
      'log-1',
      { status: 'success' }
    );
    expect(mocks.releaseRequestLock).toHaveBeenCalledWith('user-1');
  });
});
