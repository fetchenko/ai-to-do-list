import { describe, expect, it } from 'vitest';

import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';

describe('normalizeApiError', () => {
  it('exposes a safe message and omits internal diagnostic details', () => {
    const error = new AppError(
      ErrorCode.AI_UNAVAILABLE,
      503,
      'Provider response included private diagnostic data',
      {
        upstreamStatus: 503,
        responseBody: 'private provider response',
      }
    );

    expect(normalizeApiError(error)).toEqual({
      success: false,
      code: ErrorCode.AI_UNAVAILABLE,
      message: 'Subtask generation is temporarily unavailable.',
    });
  });

  it('does not expose unexpected error messages', () => {
    expect(
      normalizeApiError(new Error('Database connection string: secret'))
    ).toEqual({
      success: false,
      code: ErrorCode.AI_GENERATION_FAILED,
      message: 'AI generation failed',
    });
  });
});
