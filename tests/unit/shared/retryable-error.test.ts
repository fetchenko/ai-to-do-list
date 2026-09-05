import { describe, expect, it } from 'vitest';

import {
  AiGenerationTimeout,
  ValidationRequestError,
} from '@/shared/errors/app-error';
import { isRetryableError } from '@/shared/errors/utils/retryable-errors';

describe('retryable error mapping', () => {
  it('marks AI timeout errors as retryable', () => {
    expect(
      isRetryableError(new AiGenerationTimeout('AI generation timed out'))
    ).toBe(true);
  });

  it('marks validation errors as non-retryable', () => {
    expect(isRetryableError(new ValidationRequestError({}))).toBe(false);
  });
});
