import { NextResponse } from 'next/server';

import { ErrorHttpStatus } from '@/infrastructure/http/error-http-status';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';

export function apiErrorResponse(error: unknown) {
  const code = error instanceof AppError
    ? error.code
    : isAbortError(error)
      ? ErrorCode.AI_GENERATION_TIMEOUT
      : ErrorCode.INTERNAL_SERVER_ERROR;

  const message = error instanceof AppError
    ? error.message
    : isAbortError(error)
      ? 'AI request timed out'
      : 'Something went wrong.';

  if (!(error instanceof AppError) && !isAbortError(error)) {
    console.error('Unexpected API error:', error);
  }

  return NextResponse.json(
    { error: { code, message } },
    { status: ErrorHttpStatus[code] }
  );
}
