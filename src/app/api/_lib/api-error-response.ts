import { NextResponse } from 'next/server';

import { ErrorHttpStatus } from '@/infrastructure/http/error-http-status';
import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';

export function apiErrorResponse(error: unknown) {
  const isKnownError = error instanceof AppError || isAbortError(error);
  const normalizedError = isKnownError
    ? normalizeApiError(error)
    : {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'Something went wrong.',
      };

  if (!isKnownError) {
    console.error('Unexpected API error:', error);
  }

  return NextResponse.json(
    {
      error: {
        code: normalizedError.code,
        message: normalizedError.message,
      },
    },
    { status: ErrorHttpStatus[normalizedError.code] }
  );
}
