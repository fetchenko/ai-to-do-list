import { describe, expect, it } from 'vitest';

import { ClientError } from '@/client/errors/client-error';
import { getFriendlyErrorMessage } from '@/client/errors/error-messages';
import { ErrorCode } from '@/shared/errors/code';

describe('getFriendlyErrorMessage', () => {
  it('maps frontend errors to user-facing messages', () => {
    expect(
      getFriendlyErrorMessage(new ClientError(ErrorCode.AI_UNAVAILABLE))
    ).toBe('Subtask generation is temporarily unavailable.');
  });

  it('does not expose unknown error messages', () => {
    expect(
      getFriendlyErrorMessage(new Error('provider credentials leaked'))
    ).toBe('Something went wrong. Please try again.');
  });

  it('classifies network TypeErrors', () => {
    expect(getFriendlyErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Network error — check your connection and try again.'
    );
  });
});
