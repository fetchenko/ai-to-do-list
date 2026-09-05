import { describe, expect, it, vi } from 'vitest';

import {
  acquireAiRequestLock,
} from '@/infrastructure/ai/generations/ai-generation-lock';
import {
  releaseRequestLock,
  tryAcquireLock,
} from '@/infrastructure/ai/services/ai-lock.admin.service';

vi.mock('@/infrastructure/ai/services/ai-lock.admin.service', () => ({
  releaseRequestLock: vi.fn(),
  tryAcquireLock: vi.fn(),
}));

describe('acquireAiRequestLock', () => {
  it('throws when the request lock is already active', async () => {
    vi.mocked(tryAcquireLock).mockResolvedValue(false);

    await expect(acquireAiRequestLock('user-1')).rejects.toMatchObject({
      code: 'AI_LOCK_ACTIVE',
    });
    expect(releaseRequestLock).not.toHaveBeenCalled();
  });

  it('releases an acquired lock only once', async () => {
    vi.mocked(tryAcquireLock).mockResolvedValue(true);
    const releasePromise = Promise.resolve();
    vi.mocked(releaseRequestLock).mockReturnValue(releasePromise);

    const lock = await acquireAiRequestLock('user-1');

    const first = lock.release();
    const second = lock.release();

    expect(first).toBe(releasePromise);
    expect(second).toBe(first);
    expect(releaseRequestLock).toHaveBeenCalledOnce();
    expect(releaseRequestLock).toHaveBeenCalledWith('user-1');
  });
});
