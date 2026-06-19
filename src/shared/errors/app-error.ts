import { ErrorCode } from "./code";
import { ErrorHttpStatus } from "./http-status-map";

export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: unknown,
    public retryable?: boolean,
  ) {
    super(message);
  }
}

export class ValidationRequestError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.INVALID_REQUEST,
      ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
      "Invalid request",
      details,
    );
  }
}

export class AuthorizationError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorHttpStatus[ErrorCode.AUTHORIZATION_ERROR],
      "Authorization failed",
      details,
    );
  }
}

export class AiTimeoutError extends AppError {
  constructor() {
    super(
      ErrorCode.AI_TIMEOUT,
      504,
      "Subtasks generation timed out",
      undefined,
      true,
    );
  }
}

export class DatabaseError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.DATABASE_ERROR,
      ErrorHttpStatus[ErrorCode.DATABASE_ERROR],
      "Failed database request",
      details,
    );
  }
}

export class AiRateLimitsError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_RATE_LIMIT,
      ErrorHttpStatus[ErrorCode.AI_RATE_LIMIT],
      "Failed to generate subtasks by AI",
      details,
    );
  }
}

export class AiGenerationError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_GENERATION_FAILED,
      ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      "Failed to generate subtasks by AI",
      details,
    );
  }
}

export class ResponseFormatError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.INVALID_RESPONSE,
      ErrorHttpStatus[ErrorCode.INVALID_RESPONSE],
      "Invalid response",
      details,
    );
  }
}

export class AiLockActiveError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_LOCK_ACTIVE,
      ErrorHttpStatus[ErrorCode.AI_LOCK_ACTIVE],
      "AI already running",
      details,
    );
  }
}

export class AiUnavailableError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_UNAVAILABLE,
      ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
      "AI unavailable",
      details,
    );
  }
}

export class AiLockRequestFailedError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_LOCK_REQUEST_FAILED,
      ErrorHttpStatus[ErrorCode.AI_LOCK_REQUEST_FAILED],
      "Failed to request lock status",
      details,
    );
  }
}

export class AiRequestLimitError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_REQUEST_LIMIT,
      ErrorHttpStatus[ErrorCode.AI_REQUEST_LIMIT],
      "Reached limit of AI requests",
      details,
    );
  }
}
