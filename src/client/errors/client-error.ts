import type { ErrorCode } from '@/shared/errors/code';

export interface ClientErrorOptions extends ErrorOptions {
  status?: number;
}

export class ClientError extends Error {
  public readonly status?: number;

  constructor(
    public readonly code: ErrorCode,
    options?: ClientErrorOptions
  ) {
    super('Client operation failed', options);
    this.name = 'ClientError';
    this.status = options?.status;
  }
}
