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
      usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        finish_reason: 'tool_calls',
        reasoning_tokens: 0,
        cache_hit_tokens: 0,
        cache_miss_tokens: 0,
        duration_ms: null,
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
      '{"type":"subtask","subtask":{"title":"Book hotel"}}\n'
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
          usage: {
            input_tokens: 1,
            output_tokens: 2,
            total_tokens: 3,
            finish_reason: 'stop',
            reasoning_tokens: 0,
            cache_hit_tokens: 0,
            cache_miss_tokens: 0,
            duration_ms: null,
          },
        },
      },
    ]);

    const { stream } = await streamSubtasksForTask({
      task,
      userId: 'user-1',
      provider,
    });

    expect(await collectResponse(stream)).toBe('');
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
          usage: {
            input_tokens: 1,
            output_tokens: 1,
            total_tokens: 2,
            finish_reason: 'tool_calls',
            reasoning_tokens: 0,
            cache_hit_tokens: 0,
            cache_miss_tokens: 0,
            duration_ms: null,
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
