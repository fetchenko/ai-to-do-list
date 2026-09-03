import { SubtasksResponse } from '@/shared/schema/subtasks.schema';

export type CombinedAiResponse = NormilizedAiResponse & { raw: string };

export type AiGenerationUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;

  reasoningTokens?: number | null;
  cacheHitTokens?: number | null;
  cacheMissTokens?: number | null;
  durationMs?: number | null;
};

export type AiGenerationMetadata = {
  model: string | null;
  response: string | null;
  finishReason?: string | null;
  providerGenerationId?: string | null;
  usage: AiGenerationUsage;
};

export type NormilizedAiResponse = {
  data: SubtasksResponse;
  metadata: AiGenerationMetadata;
};
