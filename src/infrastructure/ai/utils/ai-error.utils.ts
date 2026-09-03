import { AiErrorResult } from '@/infrastructure/ai/types/ai.types';
import { AiGenerationTimeout, AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

const DEFAULT_AI_ERROR_MESSAGE = 'AI generation failed';

export function normalizeAiError(err: unknown): AiErrorResult {
  if (err instanceof Error && err.name === 'AbortError') {
    new AiGenerationTimeout('AI request timed out');
  }

  if (err instanceof AppError) {
    return {
      success: false,
      status: err.status ?? ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
      code: err.code ?? ErrorCode.AI_GENERATION_FAILED,
      message: err.message ?? DEFAULT_AI_ERROR_MESSAGE,
      details: err.details,
    };
  }

  return {
    success: false,
    status: ErrorHttpStatus[ErrorCode.AI_GENERATION_FAILED],
    code: ErrorCode.AI_GENERATION_FAILED,
    message: DEFAULT_AI_ERROR_MESSAGE,
  };
}
