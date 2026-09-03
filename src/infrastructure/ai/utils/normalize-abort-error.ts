import { AI_GENERATION_CANCEL_CODES } from '@/shared/errors/code';

export type AiGenerationCancelReason = keyof typeof AI_GENERATION_CANCEL_CODES;

export const normalizeCancelReason = (
  reason: unknown
): AiGenerationCancelReason => {
  if (typeof reason === 'string' && reason in AI_GENERATION_CANCEL_CODES) {
    return reason as AiGenerationCancelReason;
  }

  if (reason instanceof DOMException && reason.name === 'TimeoutError') {
    return 'timeout';
  }

  return 'client_disconnect';
};
