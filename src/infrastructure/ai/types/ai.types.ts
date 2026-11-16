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

export type AiGenerationOptions = {
  format?: Record<string, unknown>;
};

export type NormilizedAiResponse = {
  data: unknown;
  metadata: AiGenerationMetadata;
};
