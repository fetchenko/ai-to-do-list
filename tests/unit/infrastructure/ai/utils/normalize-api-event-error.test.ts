import { describe, expect, it } from 'vitest';

import { normalizeApiEventError } from '@/infrastructure/ai/utils/normalize-api-event-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

describe('normalizeApiEventError', () => {
  it('normalizes an AppError and derives its HTTP status', () => {
    expect(
      normalizeApiEventError(
        new AppError(ErrorCode.AI_UNAVAILABLE, 503, 'Provider unavailable', {
          provider: 'deepseek',
        })
      )
    ).toEqual({
      success: false,
      code: ErrorCode.AI_UNAVAILABLE,
      message: 'Provider unavailable',
      details: { provider: 'deepseek' },
      status: 503,
    });
  });

  it('normalizes an abort error as a timeout', () => {
    const error = new Error('aborted');
    error.name = 'AbortError';

    expect(normalizeApiEventError(error)).toEqual({
      success: false,
      code: ErrorCode.AI_GENERATION_TIMEOUT,
      message: 'AI request timed out',
      status: ErrorHttpStatus[ErrorCode.AI_GENERATION_TIMEOUT],
    });
  });

  it('normalizes an unknown error as a generation failure', () => {
    expect(normalizeApiEventError(new Error('provider failed'))).toEqual({
      success: false,
      code: ErrorCode.AI_GENERATION_FAILED,
      message: 'AI generation failed',
      status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
    });
  });

  it('does not trust an AppError HTTP status when creating an API event', () => {
    expect(
      normalizeApiEventError(
        new AppError(ErrorCode.AI_REQUEST_LIMIT, 500, 'Too many requests')
      )
    ).toEqual({
      success: false,
      code: ErrorCode.AI_REQUEST_LIMIT,
      message: 'Too many requests',
      status: ErrorHttpStatus[ErrorCode.AI_REQUEST_LIMIT],
    });
  });
});
