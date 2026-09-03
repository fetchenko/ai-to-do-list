import { describe, expect, it, vi } from 'vitest';

import { AiGenerationResource } from '@/infrastructure/ai/generations/ai-generation';
import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log-resource';
import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-request-lock';

function createLog() {
  const complete = vi.fn().mockResolvedValue(undefined);
  const fail = vi.fn().mockResolvedValue(undefined);
  const cancel = vi.fn().mockResolvedValue(undefined);

  return {
    log: { id: 'log-1', complete, fail, cancel } as AiGenerationLog,
    complete,
    fail,
    cancel,
  };
}

function createLock() {
  const release = vi.fn().mockResolvedValue(undefined);
  return { lock: { release } as AiRequestLock, release };
}

describe('AiGenerationResource', () => {
  it('completes the generation, logs it, and releases the lock', async () => {
    const { log, complete } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);
    const input = { metadata: {} as never, response: null };

    await generation.complete(input);

    expect(complete).toHaveBeenCalledWith(input);
    expect(release).toHaveBeenCalledOnce();
  });

  it('fails the generation, logs it, and releases the lock', async () => {
    const { log, fail } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);
    const error = { code: 'AI_GENERATION_FAILED' };

    await generation.fail(error);

    expect(fail).toHaveBeenCalledWith(error);
    expect(release).toHaveBeenCalledOnce();
  });

  it('cancels the generation, logs it, and releases the lock', async () => {
    const { log, cancel } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);

    await generation.cancel('client_disconnect');

    expect(cancel).toHaveBeenCalledWith('client_disconnect');
    expect(release).toHaveBeenCalledOnce();
  });

  it('does not perform another terminal transition after completion', async () => {
    const { log, complete, fail, cancel } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);

    await generation.complete({ metadata: {} as never, response: null });
    await generation.fail({ code: 'AI_GENERATION_FAILED' });
    await generation.cancel('client_disconnect');

    expect(complete).toHaveBeenCalledOnce();
    expect(fail).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledOnce();
  });

  it('allows only one terminal transition under concurrent calls', async () => {
    const { log, complete, fail, cancel } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);

    await Promise.all([
      generation.complete({ metadata: {} as never, response: null }),
      generation.fail({ code: 'AI_GENERATION_FAILED' }),
      generation.cancel('client_disconnect'),
    ]);

    expect(
      complete.mock.calls.length +
        fail.mock.calls.length +
        cancel.mock.calls.length
    ).toBe(1);
    expect(release).toHaveBeenCalledOnce();
  });

  it('releases the lock when no log exists', async () => {
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(null, lock);

    await generation.complete({ metadata: {} as never, response: null });

    expect(release).toHaveBeenCalledOnce();
  });

  it('does not fail when writing the log fails', async () => {
    const { log, complete } = createLog();
    complete.mockRejectedValueOnce(new Error('logging failed'));
    const { lock, release } = createLock();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      await new AiGenerationResource(log, lock).complete({
        metadata: {} as never,
        response: null,
      });

      expect(release).toHaveBeenCalledOnce();
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});
