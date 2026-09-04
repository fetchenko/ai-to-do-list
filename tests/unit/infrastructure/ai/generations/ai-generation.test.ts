import { describe, expect, it, vi } from 'vitest';

import { AiGenerationResource } from '@/infrastructure/ai/generations/ai-generation';
import type { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';

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

async function runTerminalOperation(
  generation: AiGenerationResource,
  operation: 'complete' | 'fail' | 'cancel'
) {
  switch (operation) {
    case 'complete':
      await generation.complete({ metadata: {} as never });
      break;
    case 'fail':
      await generation.fail({ code: 'AI_GENERATION_FAILED' });
      break;
    case 'cancel':
      await generation.cancel('client_disconnect');
      break;
  }
}

describe('AiGenerationResource', () => {
  it('exposes the generation log id', () => {
    const { log } = createLog();
    const { lock } = createLock();

    expect(new AiGenerationResource(log, lock).id).toBe('log-1');
  });

  it('completes the generation, logs it, and releases the lock', async () => {
    const { log, complete } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);
    const input = { metadata: {} as never };

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

  it.each([
    ['completion', 'complete', 'fail', 'cancel'],
    ['failure', 'fail', 'complete', 'cancel'],
    ['cancellation', 'cancel', 'complete', 'fail'],
  ] as const)(
    'does not perform another terminal transition after %s',
    async (_name, first, second, third) => {
      const { log, complete, fail, cancel } = createLog();
      const { lock, release } = createLock();
      const generation = new AiGenerationResource(log, lock);

      await runTerminalOperation(generation, first);
      await runTerminalOperation(generation, second);
      await runTerminalOperation(generation, third);

      expect(
        complete.mock.calls.length +
          fail.mock.calls.length +
          cancel.mock.calls.length
      ).toBe(1);

      expect(release).toHaveBeenCalledOnce();
    }
  );

  it('allows only one terminal transition under concurrent calls', async () => {
    const { log, complete, fail, cancel } = createLog();
    const { lock, release } = createLock();
    const generation = new AiGenerationResource(log, lock);

    await Promise.all([
      generation.complete({ metadata: {} as never }),
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

    await generation.complete({ metadata: {} as never });

    expect(release).toHaveBeenCalledOnce();
  });

  it.each([
    ['complete', 'complete'],
    ['fail', 'fail'],
    ['cancel', 'cancel'],
  ] as const)(
    'releases the lock when %s log persistence fails',
    async (_name, operation) => {
      const { log, complete, fail, cancel } = createLog();
      const { lock, release } = createLock();
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const method =
        operation === 'complete'
          ? complete
          : operation === 'fail'
            ? fail
            : cancel;
      method.mockRejectedValueOnce(new Error('logging failed'));

      try {
        const generation = new AiGenerationResource(log, lock);
        await runTerminalOperation(generation, operation);

        expect(release).toHaveBeenCalledOnce();
        expect(consoleError).toHaveBeenCalledOnce();
      } finally {
        consoleError.mockRestore();
      }
    }
  );
});
