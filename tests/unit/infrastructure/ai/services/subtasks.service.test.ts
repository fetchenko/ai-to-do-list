import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { releaseRequestLock } from '@/infrastructure/ai/services/ai-lock.admin.service';
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

vi.mock('@/infrastructure/ai/services/ai-lock.admin.service', () => ({
  releaseRequestLock: vi.fn(),
}));

vi.mock('@/infrastructure/ai/utils/ai-log.utils', () => ({
  getInitialAiLog: vi.fn(() => ({ status: 'pending' })),
  getSuccessAiLogs: vi.fn(() => ({ status: 'success' })),
  getFailedAiLogs: vi.fn(() => ({ status: 'failed' })),
}));

const mockedCreateAiLog = vi.mocked(createAiLog);
const mockedUpdateAiLog = vi.mocked(updateAiLog);
const mockedReleaseRequestLock = vi.mocked(releaseRequestLock);
const mockedGetSuccessAiLogs = vi.mocked(getSuccessAiLogs);
const mockedGetFailedAiLogs = vi.mocked(getFailedAiLogs);

async function collectResponse(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
  }

  return chunks.join('');
}

const task = {
  user_id: 'user-id',
  id: 'task-1',
  title: 'Plan a trip',
};

function createProvider(chunks: AiStreamEvent[]): AIProvider {
  return {
    generate: vi.fn(),
    stream: async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
    },
  };
}

describe('streamSubtasksForTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateAiLog.mockResolvedValue('log-1');
  });

  it('streams subtasks and records successful completion metadata', async () => {
    const metadata = {
      model: 'deepseek-v4-flash',
      response: '[{"title":"Book hotel"}]',
      finishReason: 'tool_calls',
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
        reasoningTokens: 0,
        cacheHitTokens: 0,
        cacheMissTokens: 0,
        durationMs: null,
      },
    };

    const provider = createProvider([
      {
        type: 'subtask',
        subtask: { title: 'Book hotel' },
      },
      {
        type: 'done',
        metadata,
      },
    ]);

    const { stream, aiLogId } = await streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
    });

    expect(aiLogId).toBe('log-1');
    expect(await collectResponse(stream)).toBe(
      '{"type":"subtask","subtask":{"title":"Book hotel"}}\n{"type":"done"}\n'
    );

    expect(mockedGetSuccessAiLogs).toHaveBeenCalledWith(
      metadata,
      metadata.response
    );
    expect(mockedUpdateAiLog).toHaveBeenCalledWith('log-1', {
      status: 'success',
    });
    expect(mockedReleaseRequestLock).toHaveBeenCalledWith('user-1');
  });

  it('does not write completion metadata to the client stream', async () => {
    const provider = createProvider([
      {
        type: 'done',
        metadata: {
          model: 'ollama',
          response: '[]',
          finishReason: 'stop',

          usage: {
            inputTokens: 1,
            outputTokens: 2,
            totalTokens: 3,
            reasoningTokens: 0,
            cacheHitTokens: 0,
            cacheMissTokens: 0,
            durationMs: null,
          },
        },
      },
    ]);

    const { stream } = await streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
    });

    expect(await collectResponse(stream)).toBe('{"type":"done"}\n');
  });

  it('records a failed generation and releases the lock when the provider fails', async () => {
    const error = new Error('provider failed');
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        throw error;
      },
    };

    const { stream } = await streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
    });

    const reader = stream.getReader();
    await expect(reader.read()).rejects.toThrow('provider failed');

    expect(mockedGetFailedAiLogs).toHaveBeenCalled();
    expect(mockedUpdateAiLog).toHaveBeenCalledWith('log-1', {
      status: 'failed',
    });
    expect(mockedReleaseRequestLock).toHaveBeenCalledWith('user-1');
  });

  it('releases the lock when logging fails after a successful generation', async () => {
    mockedUpdateAiLog.mockRejectedValueOnce(new Error('logging failed'));

    const provider = createProvider([
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
            reasoningTokens: 0,
            cacheHitTokens: 0,
            cacheMissTokens: 0,
            durationMs: null,
          },
        },
      },
    ]);

    const { stream } = await streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
    });

    await expect(collectResponse(stream)).rejects.toThrow('logging failed');
    expect(mockedReleaseRequestLock).toHaveBeenCalledWith('user-1');
  });
});
