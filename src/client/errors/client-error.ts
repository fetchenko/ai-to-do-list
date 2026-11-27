import type { ErrorCode } from '@/shared/errors/code';

export const ClientErrorCode = {
  REQUEST_ABORTED: 'REQUEST_ABORTED',
  CLIENT_INTERNAL_ERROR: 'CLIENT_INTERNAL_ERROR',
} as const;

export type ClientErrorCode =
  (typeof ClientErrorCode)[keyof typeof ClientErrorCode];

export interface ClientErrorOptions {
  /** HTTP response status, when the error came from an HTTP response. */
  status?: number;
  /** Original error, retained for diagnostics. */
  cause?: unknown;
}

export class ClientError extends Error {
  public readonly status?: number;

  constructor(
    public readonly code: ErrorCode | ClientErrorCode,
    message: string,
    options: ClientErrorOptions = {}
  ) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause }
    );

    this.name = 'ClientError';
    this.status = options.status;
  }
}
