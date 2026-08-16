import { beforeEach, describe, expect, it, vi } from 'vitest';

import { generateSubtasksStream } from '@/infrastructure/ai/services/subtasks.service';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

const mocks = vi.hoisted(() => ({
  createAiLog: vi.fn(),
  updateAiLog: vi.fn(),
  getAIProvider: vi.fn(),
  getInitialAiLog: vi.fn(),
  getSuccessAiLogs: vi.fn(),
  getFailedAiLogs: vi.fn(),
}));

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiLog: mocks.createAiLog,
  updateAiLog: mocks.updateAiLog,
}));

vi.mock('@/infrastructure/ai/providers/ai-provider', () => ({
  getAIProvider: mocks.getAIProvider,
}));

vi.mock('@/infrastructure/ai/utils/ai-log.utils', () => ({
  getInitialAiLog: mocks.getInitialAiLog,
  getSuccessAiLogs: mocks.getSuccessAiLogs,
  getFailedAiLogs: mocks.getFailedAiLogs,
}));

async function* providerStream(...events: unknown[]) {
  for (const event of events) yield event;
}

async function collectEvents(
  args: Parameters<typeof generateSubtasksStream>[0]
) {
  const events = [];

  for await (const event of generateSubtasksStream(args)) {
    events.push(event);
  }

  return events;
}

describe('generateSubtasksStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createAiLog.mockResolvedValue('log-1');
    mocks.getInitialAiLog.mockReturnValue({ status: 'pending' });
    mocks.getSuccessAiLogs.mockReturnValue({ status: 'success' });
    mocks.getFailedAiLogs.mockReturnValue({ status: 'failed' });
  });

  it('emits completed subtasks and then done', async () => {
    mocks.getAIProvider.mockReturnValue({
      generateStream: () =>
        providerStream(
          {
            type: 'content',
            content:
              '{"subtasks":[{"title":"One","description":"First"}',
          },
          {
            type: 'content',
            content: ',{"title":"Two"}]}',
          },
          {
            type: 'complete',
            response: {
              data: {
                subtasks: [
                  { title: 'One', description: 'First' },
                  { title: 'Two' },
                ],
              },
              aiLogs: { model: 'test' },
              raw: '{"subtasks":[{"title":"One"},{"title":"Two"}]}',
            },
          }
        ),
    });

    const events = await collectEvents({
      task: { id: 'task-1', title: 'Test task' },
      userId: 'user-1',
      signal: new AbortController().signal,
    });

    expect(events).toEqual([
      {
        type: 'subtask',
        subtask: { title: 'One', description: 'First' },
      },
      { type: 'subtask', subtask: { title: 'Two' } },
      { type: 'done' },
    ]);

    expect(mocks.updateAiLog).toHaveBeenCalledWith(
      'log-1',
      { status: 'success' }
    );
  });

  it('fails when the provider completes without subtasks', async () => {
    mocks.getAIProvider.mockReturnValue({
      generateStream: () =>
        providerStream(
          { type: 'content', content: '{"subtasks":[]}' },
          {
            type: 'complete',
            response: {
              data: { subtasks: [] },
              aiLogs: {},
              raw: '{"subtasks":[]}',
            },
          }
        ),
    });

    await expect(
      collectEvents({
        task: { id: 'task-1', title: 'Test task' },
        userId: 'user-1',
        signal: new AbortController().signal,
      })
    ).rejects.toMatchObject({ code: ErrorCode.AI_EMPTY_RESPONSE });

    expect(mocks.getFailedAiLogs).toHaveBeenCalled();
  });

  it('fails when the provider ends without a completion event', async () => {
    mocks.getAIProvider.mockReturnValue({
      generateStream: () =>
        providerStream({
          type: 'content',
          content: '{"subtasks":[{"title":"One"}]}',
        }),
    });

    await expect(
      collectEvents({
        task: { id: 'task-1', title: 'Test task' },
        userId: 'user-1',
        signal: new AbortController().signal,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.AI_INVALID_RESPONSE_FORMAT,
    });
  });

  it('fails when streamed subtasks do not match the completed response', async () => {
    mocks.getAIProvider.mockReturnValue({
      generateStream: () =>
        providerStream(
          {
            type: 'content',
            content: '{"subtasks":[{"title":"One"}]}',
          },
          {
            type: 'complete',
            response: {
              data: {
                subtasks: [{ title: 'One' }, { title: 'Two' }],
              },
              aiLogs: {},
              raw: '{"subtasks":[{"title":"One"},{"title":"Two"}]}',
            },
          }
        ),
    });

    await expect(
      collectEvents({
        task: { id: 'task-1', title: 'Test task' },
        userId: 'user-1',
        signal: new AbortController().signal,
      })
    ).rejects.toMatchObject({
      code: ErrorCode.AI_INVALID_RESPONSE_FORMAT,
    });
  });

  it('preserves provider errors and records a failed log', async () => {
    const error = new AppError(
      ErrorCode.AI_UNAVAILABLE,
      503,
      'AI unavailable'
    );

    mocks.getAIProvider.mockReturnValue({
      generateStream: async function* () {
        yield { type: 'content', content: '{"subtasks":[' };
        throw error;
      },
    });

    await expect(
      collectEvents({
        task: { id: 'task-1', title: 'Test task' },
        userId: 'user-1',
        signal: new AbortController().signal,
      })
    ).rejects.toBe(error);

    expect(mocks.getFailedAiLogs).toHaveBeenCalled();
    expect(mocks.updateAiLog).toHaveBeenCalledWith(
      'log-1',
      { status: 'failed' }
    );
  });
});
