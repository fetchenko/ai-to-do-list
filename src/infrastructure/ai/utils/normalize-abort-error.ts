import { AI_GENERATION_CANCEL_CODES } from '@/shared/errors/code';

export type AiGenerationCancelReason = keyof typeof AI_GENERATION_CANCEL_CODES;

export const normalizeCancelReason = (
  reason: string
): AiGenerationCancelReason => {
  if (reason in AI_GENERATION_CANCEL_CODES) {
    return reason as AiGenerationCancelReason;
  }

  return 'client_disconnect';
};
