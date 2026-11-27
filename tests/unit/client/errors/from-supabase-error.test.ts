import { describe, expect, it } from 'vitest';

import {
  runClientSupabaseQuery,
  toClientSupabaseError,
} from '@/client/errors/from-supabase-error';
import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

describe('client Supabase error normalization', () => {
  it('returns data when a query succeeds', async () => {
    const data = [{ id: 'task-1' }];

    await expect(
      runClientSupabaseQuery(Promise.resolve({ data, error: null }))
    ).resolves.toBe(data);
  });

  it('normalizes returned PostgREST errors', async () => {
    const error = {
      code: '23505',
      message: 'duplicate key',
      details: 'Key already exists',
      hint: '',
    };

    await expect(
      runClientSupabaseQuery(Promise.resolve({ data: null, error }))
    ).rejects.toMatchObject({
      code: ErrorCode.INVALID_REQUEST,
      message: 'This already exists.',
    });
  });

  it('normalizes rejected network requests', async () => {
    await expect(
      runClientSupabaseQuery(
        Promise.reject(new TypeError('Failed to fetch'))
      )
    ).rejects.toMatchObject({
      code: ErrorCode.NETWORK_ERROR,
      status: 503,
    });
  });

  it('preserves the original error as the ClientError cause', () => {
    const original = new Error('unexpected');
    const normalized = toClientSupabaseError(original);

    expect(normalized).toBeInstanceOf(ClientError);
    expect(normalized.cause).toBe(original);
    expect(normalized.code).toBe(ErrorCode.UNKNOWN);
  });
});
