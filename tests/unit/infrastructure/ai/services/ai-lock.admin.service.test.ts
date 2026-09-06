import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  releaseRequestLock,
  tryAcquireLock,
} from '@/infrastructure/ai/services/ai-lock.admin.service';
import { AiLockRequestFailedError } from '@/shared/errors/app-error';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock('@/infrastructure/supabase/admin', () => ({
  supabaseAdmin: { rpc: mocks.rpc },
}));

describe('ai-lock.admin.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when the lock is acquired', async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await expect(tryAcquireLock('user-1')).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith('try_acquire_user_ai_lock', {
      p_user_id: 'user-1',
    });
  });

  it('returns false when the lock is already active', async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });

    await expect(tryAcquireLock('user-1')).resolves.toBe(false);
  });

  it('throws when acquiring the lock fails', async () => {
    const error = new Error('RPC failed');
    mocks.rpc.mockResolvedValue({ data: null, error });

    await expect(tryAcquireLock('user-1')).rejects.toEqual(
      new AiLockRequestFailedError(error)
    );
  });

  it('releases the lock for the given user', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(releaseRequestLock('user-1')).resolves.toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith('release_user_ai_lock', {
      p_user_id: 'user-1',
    });
  });

  it('does not throw when the release RPC succeeds', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(releaseRequestLock('user-1')).resolves.toBeUndefined();
  });
});
