import type { PostgrestError } from '@supabase/supabase-js';

import { ErrorCode } from '@/shared/errors/code';

import { ClientError } from './client-error';

export function fromSupabaseError(error: PostgrestError): ClientError {
  switch (error.code) {
    case '23505':
      return new ClientError(ErrorCode.INVALID_REQUEST);
    case '42501':
      return new ClientError(ErrorCode.FORBIDDEN);
    default:
      return new ClientError(ErrorCode.DATABASE_ERROR);
  }
}
