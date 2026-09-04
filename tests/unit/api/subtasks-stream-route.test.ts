import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/tasks/[taskId]/subtasks/stream/route';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getTaskForUser: vi.fn(),
  getAIProvider: vi.fn(),
  checkAiQuotaLimit: vi.fn(),
  parseAiParams: vi.fn(),
  streamSubtasksForTask: vi.fn(),
  normalizeAiError: vi.fn(),
}));

vi.mock('@/features/auth/repository/auth.server.repository', () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock('@/features/tasks/repository/tasks.admin.repository', () => ({ getTaskForUser: mocks.getTaskForUser }));
vi.mock('@/infrastructure/ai/providers/ai-provider', () => ({ getAIProvider: mocks.getAIProvider }));
vi.mock('@/infrastructure/ai/services/ai-quota-limit.admin.service', () => ({ checkAiQuotaLimit: mocks.checkAiQuotaLimit }));
vi.mock('@/infrastructure/ai/services/subtasks.service', () => ({ streamSubtasksForTask: mocks.streamSubtasksForTask }));
vi.mock('@/infrastructure/ai/utils/ai-params.utils', () => ({ parseAiParams: mocks.parseAiParams }));
vi.mock('@/infrastructure/ai/utils/normalize-ai-error', () => ({ normalizeAiError: mocks.normalizeAiError }));

describe('POST /api/tasks/[taskId]/subtasks/stream/route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.getAIProvider.mockReturnValue({ quotaLimit: 20 });
    mocks.checkAiQuotaLimit.mockResolvedValue(undefined);
    mocks.parseAiParams.mockResolvedValue({ taskId: 'task-1' });
    mocks.getTaskForUser.mockResolvedValue({ id: 'task-1', title: 'Test task' });
    mocks.streamSubtasksForTask.mockResolvedValue(new ReadableStream());
    mocks.normalizeAiError.mockImplementation((error: Error) => ({
      status: 500,
      code: 'AI_GENERATION_FAILED',
      message: error.message,
      success: false,
    }));
  });

  it('returns the generation stream with NDJSON headers', async () => {
    const stream = new ReadableStream<Uint8Array>();
    mocks.streamSubtasksForTask.mockResolvedValue(stream);
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    const response = await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(response.status).toBe(200);
    expect(response.body).toBe(stream);
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-transform');
    expect(mocks.streamSubtasksForTask).toHaveBeenCalledWith(expect.objectContaining({
      task: { id: 'task-1', title: 'Test task' },
      userId: 'user-1',
    }));
  });

  it('checks quota before starting the stream', async () => {
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(mocks.checkAiQuotaLimit).toHaveBeenCalledWith('user-1', 20);
    expect(mocks.streamSubtasksForTask).toHaveBeenCalled();
  });

  it('skips quota checks when the provider has no quota limit', async () => {
    mocks.getAIProvider.mockReturnValue({ quotaLimit: undefined });
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(mocks.checkAiQuotaLimit).not.toHaveBeenCalled();
  });

  it('passes the request abort signal to the generation service', async () => {
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(mocks.streamSubtasksForTask).toHaveBeenCalledWith(expect.objectContaining({
      signal: expect.any(AbortSignal),
    }));
  });

  it('returns normalized errors when setup fails', async () => {
    const error = new Error('quota failed');
    mocks.checkAiQuotaLimit.mockRejectedValue(error);
    mocks.normalizeAiError.mockReturnValue({
      status: 409,
      code: 'AI_REQUEST_LIMIT',
      message: 'Reached limit of AI requests',
      success: false,
    });
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    const response = await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: {
        code: 'AI_REQUEST_LIMIT',
        message: 'Reached limit of AI requests',
        success: false,
      },
    });
    expect(mocks.streamSubtasksForTask).not.toHaveBeenCalled();
  });

  it('does not start generation when task lookup fails', async () => {
    const error = new Error('task not found');
    mocks.getTaskForUser.mockRejectedValue(error);
    mocks.normalizeAiError.mockReturnValue({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Task not found',
      success: false,
    });
    const request = new Request('http://localhost/api/tasks/task-1/subtasks/stream', { method: 'POST' });

    const response = await POST(request, { params: Promise.resolve({ taskId: 'task-1' }) });

    expect(response.status).toBe(404);
    expect(mocks.streamSubtasksForTask).not.toHaveBeenCalled();
  });
});
