import type { ErrorCode } from '@/shared/errors/code';

export class ClientError extends Error {
  constructor(
    public readonly code: ErrorCode,
    options?: ErrorOptions
  ) {
    super('Client operation failed', options);
    this.name = 'ClientError';
  }
}
