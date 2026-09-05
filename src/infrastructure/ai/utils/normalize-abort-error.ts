import { AI_GENERATION_CANCEL_CODES } from '@/shared/errors/code';

export type AiGenerationCancelReason = keyof typeof AI_GENERATION_CANCEL_CODES;

function isAiGenerationCancelReason(
  value: string
): value is AiGenerationCancelReason {
  return value in AI_GENERATION_CANCEL_CODES;
}

export const normalizeCancelReason = (
  reason: unknown
): AiGenerationCancelReason => {
  if (typeof reason === 'string' && isAiGenerationCancelReason(reason)) {
    return reason;
  }

  if (reason instanceof DOMException && reason.name === 'TimeoutError') {
    return 'timeout';
  }

  return 'client_disconnect';
};
