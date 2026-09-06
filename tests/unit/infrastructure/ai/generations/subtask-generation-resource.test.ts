import { collect } from '@tests/utils/collect';
import { describe, expect, it, vi } from 'vitest';

import { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { SubtaskGenerationResource } from '@/infrastructure/ai/generations/subtask-generation';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import type { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import type { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

const task = { user_id: 'user-id', id: 'task-1', title: 'Plan a trip' };

function createGenerationLog() {
  return {
    id: null,
    complete: vi.fn().mockResolvedValue(undefined),
    fail: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
  } as unknown as AiGenerationLog;
}
function createGenerationLock() {
  return { release: vi.fn().mockResolvedValue(undefined) } as AiRequestLock;
}

function createProvider(events: AiStreamEvent[]): AIProvider {
  return {
    generate: vi.fn(),
    stream: async function* () {
      yield* events;
    },
  };
}

async function collectStream(resource: SubtaskGenerationResource) {
  const chunks = await collect(resource.stream());
  return chunks.flatMap((chunk) =>
    new TextDecoder()
      .decode(chunk)
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SubtaskStreamEvent)
  );
}

describe('SubtaskGenerationResource', () => {
  it('streams subtasks and completes on done', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();

    const metadata = {
      model: 'test',
      response: '[]',
      finishReason: 'tool_calls',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    };
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider: createProvider([
        { type: 'subtask', subtask: { title: 'Book hotel' } },
        { type: 'done', metadata },
      ]),
      signal: new AbortController().signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([
      { type: 'subtask', subtask: { title: 'Book hotel' } },
      { type: 'done' },
    ]);
    expect(generationLog.complete).toHaveBeenCalledWith({ metadata });
    expect(generationLog.fail).not.toHaveBeenCalled();
    expect(generationLog.cancel).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('fails and emits the provider error event', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const error = {
      success: false,
      status: 502,
      code: 'AI_GENERATION_FAILED',
      message: 'AI generation failed',
    };
    const provider = createProvider([]);
    provider.stream = vi.fn(async function* () {
      throw new Error('provider failed');
    });

    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: new AbortController().signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([
      { type: 'error', error },
    ]);
    expect(generationLog.fail).toHaveBeenCalledWith({ code: error.code });
    expect(generationLog.complete).not.toHaveBeenCalled();
    expect(generationLog.cancel).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('cancels as a client disconnect when the stream is aborted', async () => {
    const controller = new AbortController();
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        controller.abort();
        throw new DOMException('The operation was aborted.', 'AbortError');
      },
    };
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: controller.signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([]);
    expect(generationLog.cancel).toHaveBeenCalledWith('client_disconnect');
    expect(generationLog.fail).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('cancels as a timeout and emits a cancelled event when aborted with TimeoutError', async () => {
    const controller = new AbortController();
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider: createProvider([]),
      signal: controller.signal,
    });

    controller.abort(
      new DOMException('The operation timed out.', 'TimeoutError')
    );

    await expect(collectStream(resource)).resolves.toEqual([
      {
        type: 'cancelled',
        error: {
          success: false,
          status: 504,
          code: 'AI_GENERATION_TIMEOUT',
          message: 'AI generation timed out',
        },
      },
    ]);
    expect(generationLog.cancel).toHaveBeenCalledWith('timeout');
    expect(generationLog.fail).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('cancels as a server shutdown and emits a cancelled event', async () => {
    const controller = new AbortController();
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider: createProvider([]),
      signal: controller.signal,
    });

    controller.abort('server_shutdown');

    await expect(collectStream(resource)).resolves.toEqual([
      {
        type: 'cancelled',
        error: {
          success: false,
          status: 503,
          code: 'AI_GENERATION_SERVER_SHUTDOWN',
          message: 'AI generation was interrupted by server shutdown',
        },
      },
    ]);
    expect(generationLog.cancel).toHaveBeenCalledWith('server_shutdown');
    expect(generationLog.fail).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('treats a provider error caused by timeout as cancellation', async () => {
    const controller = new AbortController();
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        controller.abort(
          new DOMException('The operation timed out.', 'TimeoutError')
        );
        throw new DOMException('The operation timed out.', 'TimeoutError');
      },
    };
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: controller.signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([
      {
        type: 'cancelled',
        error: {
          success: false,
          status: 504,
          code: 'AI_GENERATION_TIMEOUT',
          message: 'AI generation timed out',
        },
      },
    ]);
    expect(generationLog.cancel).toHaveBeenCalledWith('timeout');
    expect(generationLog.fail).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('fails and emits an error when the provider ends without a terminal event', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const error = {
      success: false,
      status: 422,
      code: 'AI_INVALID_RESPONSE_FORMAT',
      message: 'Invalid AI response format',
    };
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider: createProvider([
        { type: 'subtask', subtask: { title: 'Book hotel' } },
      ]),
      signal: new AbortController().signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([
      { type: 'subtask', subtask: { title: 'Book hotel' } },
      { type: 'error', error },
    ]);
    expect(generationLog.fail).toHaveBeenCalledWith({ code: error.code });
    expect(generationLog.cancel).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('stops consuming provider events after done', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const provider = createProvider([
      { type: 'done', metadata: {} as never },
      { type: 'subtask', subtask: { title: 'Should not be emitted' } },
    ]);
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: new AbortController().signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([{ type: 'done' }]);
  });

  it('does not turn a normal provider error into cancellation', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* () {
        throw new Error('provider failed');
      },
    };
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: new AbortController().signal,
    });

    await expect(collectStream(resource)).resolves.toEqual([
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

    expect(generationLog.fail).toHaveBeenCalledWith({
      code: 'AI_GENERATION_FAILED',
    });
    expect(generationLog.cancel).not.toHaveBeenCalled();
    expect(generationLog.complete).not.toHaveBeenCalled();

    expect(generationLock.release).toHaveBeenCalled();
  });

  it('aborts the provider signal when the output stream is cancelled', async () => {
    let providerSignal: AbortSignal | undefined;
    const provider: AIProvider = {
      generate: vi.fn(),
      stream: async function* (_prompt, signal) {
        providerSignal = signal;
        await new Promise<void>((resolve, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        });
      },
    };
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();
    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider,
      signal: new AbortController().signal,
    });

    const reader = resource.stream().getReader();
    await new Promise((resolve) => setTimeout(resolve, 0));

    await reader.cancel();

    expect(providerSignal?.aborted).toBe(true);
    expect(generationLog.cancel).toHaveBeenCalledWith('client_disconnect');

    await vi.waitFor(() => {
      expect(generationLock.release).toHaveBeenCalledTimes(1);
    });
  });

  it('releases the generation lock when generation completes', async () => {
    const generationLog = createGenerationLog();
    const generationLock = createGenerationLock();

    const resource = new SubtaskGenerationResource({
      generationLog,
      generationLock,
      task,
      provider: createProvider([
        {
          type: 'done',
          metadata: {} as never,
        },
      ]),
      signal: new AbortController().signal,
    });

    await collectStream(resource);

    expect(generationLog.complete).toHaveBeenCalled();
    expect(generationLock.release).toHaveBeenCalledTimes(1);
  });
});
