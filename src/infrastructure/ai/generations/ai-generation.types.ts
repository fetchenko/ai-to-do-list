import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';

export type AiGenerationStatus =
  'pending' | 'completed' | 'failed' | 'cancelled';

export type AiGenerationCancelReason =
  'client_disconnect' | 'timeout' | 'server_shutdown';

export type AiGenerationFailure = {
  code: string;
};

export type AiGenerationCompletion = {
  metadata: AiGenerationMetadata;
  response: string | null;
};
