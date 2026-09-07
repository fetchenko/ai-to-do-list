import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export class AiRateLimitsError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_RATE_LIMIT,
      ErrorHttpStatus[ErrorCode.AI_RATE_LIMIT],
      'Failed to generate subtasks by AI',
      details
    );
  }
}
export class AiGenerationError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_GENERATION_FAILED,
      ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      'Failed to generate subtasks by AI',
      details
    );
  }
}

export class AiLockActiveError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_LOCK_ACTIVE,
      ErrorHttpStatus[ErrorCode.AI_LOCK_ACTIVE],
      'AI already running',
      details
    );
  }
}
export class AiUnavailableError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_UNAVAILABLE,
      ErrorHttpStatus[ErrorCode.AI_UNAVAILABLE],
      'AI unavailable',
      details
    );
  }
}

export class AiEmptyResponseError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_EMPTY_RESPONSE,
      ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
      'AI response is empty',
      details
    );
  }
}
export class AiLockRequestFailedError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_LOCK_REQUEST_FAILED,
      ErrorHttpStatus[ErrorCode.AI_LOCK_REQUEST_FAILED],
      'Failed to request lock status',
      details
    );
  }
}

export class AiRequestLimitError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_REQUEST_LIMIT,
      ErrorHttpStatus[ErrorCode.AI_REQUEST_LIMIT],
      'Reached limit of AI requests',
      details
    );
  }
}
export class AiInvalidResponseFormat extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_INVALID_RESPONSE_FORMAT,
      ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
      'Invalid AI response format',
      details
    );
  }
}

export class AiRequestError extends AppError {
  constructor(details: unknown) {
    super(
      ErrorCode.AI_REQUEST_ERROR,
      ErrorHttpStatus[ErrorCode.AI_REQUEST_ERROR],
      'Failed to request AI',
      details
    );
  }
}

export class AiGenerationTimeout extends AppError {
  constructor(details?: unknown) {
    super(
      ErrorCode.AI_GENERATION_TIMEOUT,
      ErrorHttpStatus[ErrorCode.AI_GENERATION_TIMEOUT],
      'AI generation timed out',
      details
    );
  }
}

export class AiGenerationServerShutdown extends AppError {
  constructor(details?: unknown) {
    super(
      ErrorCode.AI_GENERATION_SERVER_SHUTDOWN,
      ErrorHttpStatus[ErrorCode.AI_GENERATION_SERVER_SHUTDOWN],
      'AI generation was interrupted by server shutdown',
      details
    );
  }
}
