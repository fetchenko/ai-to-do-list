import { describe, expect, it } from 'vitest';

import { fromSupabaseError } from '@/client/errors/from-supabase-error';
import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

describe('fromSupabaseError (client)', () => {
  it('maps unique constraint violations to invalid requests', () => {
    const error = {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      details: 'sensitive database details',
      hint: '',
    };

    expect(fromSupabaseError(error)).toEqual(
      new ClientError(ErrorCode.INVALID_REQUEST)
    );
  });

  it('maps permission errors to forbidden', () => {
    const error = {
      code: '42501',
      message: 'permission denied',
      details: 'sensitive database details',
      hint: '',
    };

    expect(fromSupabaseError(error)).toEqual(
      new ClientError(ErrorCode.FORBIDDEN)
    );
  });

  it('maps other database errors without exposing their details', () => {
    const error = {
      code: 'XX000',
      message: 'internal database failure',
      details: 'sensitive database details',
      hint: '',
    };

    expect(fromSupabaseError(error)).toEqual(
      new ClientError(ErrorCode.DATABASE_ERROR)
    );
  });
});
