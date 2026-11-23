import { AppError } from '@/shared/errors/app-error';

type ErrorLogContext = {
  source: 'api' | 'ai';
  operation: string;
  provider?: string;
  requestId?: string;
};

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  cause?: SerializedError;
};

function serializeError(error: unknown, depth = 0): SerializedError {
  if (!(error instanceof Error)) {
    if (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string'
    ) {
      return {
        name: 'ApiError',
        message:
          'message' in error && typeof error.message === 'string'
            ? error.message
            : 'API operation failed',
      };
    }

    return {
      name: 'NonErrorThrown',
      message: 'A non-Error value was thrown',
    };
  }

  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    ...(error.stack ? { stack: error.stack } : {}),
  };

  // Bound cause traversal to avoid pathological or cyclic error chains.
  if (depth < 5 && error.cause !== undefined && error.cause !== error) {
    serialized.cause = serializeError(error.cause, depth + 1);
  }

  return serialized;
}

/**
 * Writes internal diagnostic information without serializing AppError.details
 * or any other arbitrary properties that could contain secrets or user data.
 */
function getSafeDiagnosticFields(error: unknown): {
  upstreamStatus?: number;
} {
  if (!(error instanceof AppError) || !error.details) {
    return {};
  }

  if (
    typeof error.details === 'object' &&
    'upstreamStatus' in error.details &&
    typeof error.details.upstreamStatus === 'number' &&
    error.details.upstreamStatus >= 100 &&
    error.details.upstreamStatus <= 599
  ) {
    return { upstreamStatus: error.details.upstreamStatus };
  }

  return {};
}

export function logError(error: unknown, context: ErrorLogContext): void {
  const errorCode =
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : undefined;

  console.error({
    level: 'error',
    ...context,
    ...(errorCode ? { errorCode } : {}),
    ...getSafeDiagnosticFields(error),
    error: serializeError(error),
  });
}
