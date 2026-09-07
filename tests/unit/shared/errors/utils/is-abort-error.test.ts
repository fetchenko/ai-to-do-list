import { describe, expect, it } from 'vitest';

import { isAbortError } from '@/shared/errors/utils/is-abort-error';

describe('isAbortError', () => {
  it('returns true for an AbortError DOMException', () => {
    const error = new DOMException('The operation was aborted', 'AbortError');

    expect(isAbortError(error)).toBe(true);
  });

  it('returns true for an Error with name AbortError', () => {
    const error = new Error('The operation was aborted');
    error.name = 'AbortError';

    expect(isAbortError(error)).toBe(true);
  });

  it('returns false for a regular Error', () => {
    expect(isAbortError(new Error('Something went wrong'))).toBe(false);
  });

  it('returns false for a DOMException with another name', () => {
    const error = new DOMException('Invalid state', 'InvalidStateError');

    expect(isAbortError(error)).toBe(false);
  });

  it('returns false for non-error values', () => {
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
    expect(isAbortError('AbortError')).toBe(false);
    expect(isAbortError({ name: 'AbortError' })).toBe(false);
  });
});
