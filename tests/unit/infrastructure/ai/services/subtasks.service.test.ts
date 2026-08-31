import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  createAiLog,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import type { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import {
  getFailedAiLogs,
  getSuccessAiLogs,
} from '@/infrastructure/ai/utils/ai-log.utils';

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiLog: vi.fn(),
  updateAiLog: vi.fn(),
}));

vi.mock('@/infrastructure/ai/utils/ai-log.utils', () => ({
  getInitialAiLog: vi.fn(() => ({ status: 'pending' })),
  getSuccessAiLogs: vi.fn(() => ({ status: 'success' })),
  getFailedAiLogs: vi.fn(() => ({ status: 'failed' })),
}));

const mockedCreateAiLog = vi.mocked(createAiLog);
const mockedUpdateAiLog = vi.mocked(updateAiLog);
const mockedGetSuccessAiLogs = vi.mocked(getSuccessAiLogs);
const mockedGetFailedAiLogs = vi.mocked(getFailedAiLogs);

const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };
const signal = new AbortController().signal;

function createProvider(events: AiStreamEvent[]): AIProvider {
  return {
    generate: vi.fn(),
    stream: async function* (_prompt, _signal) {
      yield* events;
    },
  };
}

async function collectEvents(events: AsyncIterable<AiStreamEvent>) {
  const result: AiStreamEvent[] = [];

  for await (const event of events) {
    result.push(event);
  }

  return result;
}

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateAiLog.mockResolvedValue('log-1');
  });

  it('passes the supplied signal to the provider', async () => {
    const provider = createProvider([
      {
        type: 'done',
        metadata: {
          model: 'test',
          response: '[]',
          finishReason: 'stop',
          usage: {
            inputTokens: 1,
            outputTokens: 1,
            totalTokens: 2,
          },
        },
      },
    ]);
    const providerStream = vi.spyOn(provider, 'stream');

    await collectEvents(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider,
        signal,
      })
    );

    expect(providerStream).toHaveBeenCalledWith(expect.any(String), signal);
  });

  it('yields provider events and records successful completion metadata', async () => {
    const metadata = {
      model: 'deepseek-v4-flash',
      response: '[{"title":"Book hotel"}]',
      finishReason: 'tool_calls',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
    };
    const events: AiStreamEvent[] = [
      { type: 'subtask', subtask: { title: 'Book hotel' } },
      { type: 'done', metadata },
    ];

    const result = await collectEvents(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider: createProvider(events),
        signal,
      })
    );

    expect(result).toEqual(events);
    expect(mockedGetSuccessAiLogs).toHaveBeenCalledWith(
      metadata,
      metadata.response
    );
    expect(mockedUpdateAiLog).toHaveBeenCalledWith('log-1', {
      status: 'success',
    });
  });

  it('does not emit an error after cancellation', async () => {
    const controller = new AbortController();
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        controller.abort();
        throw new DOMException('The operation was aborted.', 'AbortError');
      },
    };

    const result = await collectEvents(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider,
        signal: controller.signal,
      })
    );

    expect(result).toEqual([]);
    expect(mockedUpdateAiLog).not.toHaveBeenCalled();
  });

  it('yields a normalized error and records the failed generation', async () => {
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        throw new Error('provider failed');
      },
    };

    const result = await collectEvents(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider,
        signal,
      })
    );

    expect(result).toEqual([
      {
        type: 'error',
        error: {
          success: false,
          status: 502,
          code: 'AI_GENERATION_FAILED',
          message: 'AI generation failed',
        },
      },
    ]);
    expect(mockedGetFailedAiLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AI_GENERATION_FAILED',
      })
    );
    expect(mockedUpdateAiLog).toHaveBeenCalledWith('log-1', {
      status: 'failed',
    });
  });

  it('does not fail the stream when successful logging fails', async () => {
    mockedUpdateAiLog.mockRejectedValueOnce(new Error('logging failed'));

    const result = await collectEvents(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider: createProvider([
          {
            type: 'done',
            metadata: {
              model: 'deepseek-v4-flash',
              response: '[]',
              finishReason: 'tool_calls',
              usage: {
                inputTokens: 1,
                outputTokens: 1,
                totalTokens: 2,
              },
            },
          },
        ]),
        signal,
      })
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('done');
  });
});
