import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';
import { isRetryableError } from '@/shared/errors/utils/retryable-errors';

describe('retryable error mapping', () => {
  it('marks AI timeout errors as retryable', () => {
    expect(
      isRetryableError(new ClientError(ErrorCode.AI_GENERATION_TIMEOUT, 504))
    ).toBe(true);
  });

  it('marks validation errors as non-retryable', () => {
    expect(isRetryableError(new ClientError(ErrorCode.INVALID_REQUEST, 400))).toBe(false);
  });
});
