import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';
import { isRetryableError } from '@/client/errors/retryable-errors';

describe('retryable error mapping', () => {
  it('marks AI timeout errors as retryable', () => {
    expect(
      isRetryableError(new ClientError(ErrorCode.AI_GENERATION_TIMEOUT))
    ).toBe(true);
  });

  it('marks validation errors as non-retryable', () => {
    expect(
      isRetryableError(new ClientError(ErrorCode.INVALID_REQUEST))
    ).toBe(false);
  });
});
