import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationRequestError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.INVALID_REQUEST,
      ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
      'Invalid request',
      details
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorHttpStatus[ErrorCode.AUTHORIZATION_ERROR],
      'Authorization failed',
      details
    );
  }
}

export class DatabaseError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.DATABASE_ERROR,
      ErrorHttpStatus[ErrorCode.DATABASE_ERROR],
      'Failed database request',
      details
    );
  }
}
