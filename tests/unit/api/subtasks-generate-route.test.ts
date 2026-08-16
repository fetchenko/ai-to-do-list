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
  getFailedAiLogs: vi.fn(() => ({ status: 'failed', error_code: 'AI_GENERATION_FAILED' })),
  getSuccessAiLogs: vi.fn(() => ({ status: 'success' })),
  normalizeAiError: vi.fn(),
}));

vi.mock('@/features/auth/repository/auth.server.repository', () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock('@/features/tasks/repository/tasks.admin.repository', () => ({ getTaskForUser: mocks.getTaskForUser }));
vi.mock('@/infrastructure/ai/services/subtasks.service', () => ({ prepareSubtasksStream: mocks.prepareSubtasksStream }));
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
vi.mock('@/infrastructure/ai/utils/ai-error.utils', () => ({ normalizeAiError: mocks.normalizeAiError }));
vi.mock('@/infrastructure/ai/utils/ai-params.utils', () => ({ parseAiParams: mocks.parseAiParams }));

async function* stream(...events: any[]) {
  for (const event of events) yield event;
}

async function readEvents(response: Response) {
  const text = await response.text();
  return text.trim().split('\n').map((line) => JSON.parse(line));
}

describe('POST /api/tasks/[taskId]/subtasks/generate/route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.checkRequestLock.mockResolvedValue(undefined);
    mocks.checkAiQuotaLimit.mockResolvedValue(undefined);
    mocks.parseAiParams.mockResolvedValue({ taskId: 'task-1' });
    mocks.getTaskForUser.mockResolvedValue({ id: 'task-1', title: 'Test task' });
    mocks.normalizeAiError.mockImplementation((error: Error) => ({
      status: 500,
      code: 'AI_GENERATION_FAILED',
      error: error.message,
    }));
  });

  it('streams subtasks and a completion event', async () => {
    mocks.prepareSubtasksStream.mockResolvedValue({
      aiLogId: 'log-1',
      stream: stream(
        { type: 'content', content: '{"subtasks":[{"title":"Write tests"}]}' },
        {
          type: 'complete',
          response: {
            data: { subtasks: [{ title: 'Write tests' }] },
            aiLogs: {},
            raw: '{"subtasks":[{"title":"Write tests"}]}',
          },
        }
      ),
    });

    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ taskId: 'task-1' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/x-ndjson');
    await expect(readEvents(response)).resolves.toEqual([
      { type: 'subtask', subtask: { title: 'Write tests' } },
      { type: 'done' },
    ]);
    expect(mocks.updateAiLog).toHaveBeenCalledWith('log-1', { status: 'success' });
    expect(mocks.releaseRequestLock).toHaveBeenCalledWith('user-1');
  });

  it('streams a normalized error when the provider fails', async () => {
    const failure = new Error('AI unavailable');
    mocks.normalizeAiError.mockReturnValue({
      status: 503,
      code: 'AI_UNAVAILABLE',
      error: 'AI unavailable',
    });
    mocks.prepareSubtasksStream.mockResolvedValue({
      aiLogId: 'log-1',
      stream: stream({ type: 'content', content: '{"subtasks":[' }, { type: 'error', error: failure }),
    });

    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ taskId: 'task-1' }),
    });

    expect(response.status).toBe(200);
    await expect(readEvents(response)).resolves.toEqual([
      {
        type: 'error',
        error: { code: 'AI_UNAVAILABLE', message: 'AI unavailable', status: 503 },
      },
    ]);
    expect(mocks.releaseRequestLock).toHaveBeenCalledWith('user-1');
  });

  it('returns a normal HTTP error before streaming starts', async () => {
    const failure = new Error('Quota exceeded');
    mocks.checkAiQuotaLimit.mockRejectedValue(failure);
    mocks.normalizeAiError.mockReturnValue({
      status: 429,
      code: 'AI_QUOTA_EXCEEDED',
      error: 'Quota exceeded',
    });

    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ taskId: 'task-1' }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: { code: 'AI_QUOTA_EXCEEDED', error: 'Quota exceeded', status: 429 },
    });
    expect(mocks.releaseRequestLock).toHaveBeenCalledWith('user-1');
  });

  it('does not emit done for an empty provider response', async () => {
    mocks.prepareSubtasksStream.mockResolvedValue({
      aiLogId: 'log-1',
      stream: stream({
        type: 'content',
        content: '{"subtasks":[]}',
      }, {
        type: 'complete',
        response: { data: { subtasks: [] }, aiLogs: {}, raw: '{"subtasks":[]}' },
      }),
    });
    mocks.normalizeAiError.mockReturnValue({
      status: 422,
      code: 'AI_EMPTY_RESPONSE',
      error: 'No meaningful subtasks could be generated.',
    });

    const response = await POST(new Request('http://localhost'), {
      params: Promise.resolve({ taskId: 'task-1' }),
    });

    expect(await readEvents(response)).toEqual([
      {
        type: 'error',
        error: { code: 'AI_EMPTY_RESPONSE', message: 'No meaningful subtasks could be generated.', status: 422 },
      },
    ]);
  });
});
