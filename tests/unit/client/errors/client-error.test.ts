import { describe, expect, it } from 'vitest';

import {
  ClientError,
  ClientErrorCode,
} from '@/client/errors/client-error';
import { ErrorCode } from '@/shared/errors/code';

describe('ClientError', () => {
  it('stores the error code and message', () => {
    const error = new ClientError(
      ErrorCode.NETWORK_ERROR,
      'The request could not be completed.'
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ClientError);
    expect(error.name).toBe('ClientError');
    expect(error.code).toBe(ClientErrorCode.NETWORK_ERROR);
    expect(error.message).toBe('The request could not be completed.');
    expect(error.status).toBeUndefined();
  });

  it('stores an HTTP status when one is available', () => {
    const error = new ClientError(
      ErrorCode.UNAUTHORIZED,
      'Please sign in.',
      { status: 401 }
    );

    expect(error.status).toBe(401);
  });

  it('supports client-only error codes', () => {
    const error = new ClientError(
      ClientErrorCode.REQUEST_ABORTED,
      'The request was cancelled.'
    );

    expect(error.code).toBe('REQUEST_ABORTED');
  });

  it('supports malformed client response codes', () => {
    const error = new ClientError(
      ErrorCode.INVALID_RESPONSE,
      'The server returned an invalid response.'
    );

    expect(error.code).toBe('INVALID_RESPONSE');
  });

  it('preserves the original error as cause', () => {
    const cause = new TypeError('Failed to fetch');
    const error = new ClientError(
      ClientErrorCode.NETWORK_ERROR,
      'The request could not be completed.',
      { cause }
    );

    expect(error.cause).toBe(cause);
  });
});
