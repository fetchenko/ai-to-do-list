import { collect } from '@tests/utils/collect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { startSubtaskGeneration } from '@/infrastructure/ai/generations/start-subtask-generation';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  cancelAiGenerationLog,
  completeAiGenerationLog,
  createAiGenerationLog,
  failAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { streamSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import type { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

vi.mock('@/infrastructure/ai/generations/start-subtask-generation', () => ({
  startSubtaskGeneration: vi.fn(),
}));

vi.mock('@/infrastructure/ai/services/ai-log.admin.service', () => ({
  createAiGenerationLog: vi.fn(),
  completeAiGenerationLog: vi.fn(),
  failAiGenerationLog: vi.fn(),
  cancelAiGenerationLog: vi.fn(),
}));

const mockedStartSubtaskGeneration = vi.mocked(startSubtaskGeneration);

const mockedCreateAiGenerationLog = vi.mocked(createAiGenerationLog);
const mockedCompleteAiGenerationLog = vi.mocked(completeAiGenerationLog);
const mockedFailAiGenerationLog = vi.mocked(failAiGenerationLog);
const mockedCancelAiGenerationLog = vi.mocked(cancelAiGenerationLog);

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

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateAiGenerationLog.mockResolvedValue('log-1');
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

    await collect(
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

    const clientEvents: SubtaskStreamEvent[] = [
      { type: 'subtask', subtask: { title: 'Book hotel' } },
      { type: 'done' },
    ];

    const result = await collect(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider: createProvider(events),
        signal,
      })
    );

    expect(result).toEqual(clientEvents);
    expect(mockedCompleteAiGenerationLog).toHaveBeenCalledWith({
      id: 'log-1',
      metadata,
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

    const result = await collect(
      streamSubtasksForTask({
        task,
        userId: 'user-1',
        provider,
        signal: controller.signal,
      })
    );

    expect(result).toEqual([]);
  });

  it('yields a normalized error and records the failed generation', async () => {
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        throw new Error('provider failed');
      },
    };

    const result = await collect(
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
    expect(failAiGenerationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AI_GENERATION_FAILED',
      })
    );
    expect(mockedFailAiGenerationLog).toHaveBeenCalledWith({
      id: 'log-1',
      errorCode: 'AI_GENERATION_FAILED',
    });
  });

  it('does not fail the stream when successful logging fails', async () => {
    mockedFailAiGenerationLog.mockRejectedValueOnce(
      new Error('logging failed')
    );

    const result = await collect(
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
