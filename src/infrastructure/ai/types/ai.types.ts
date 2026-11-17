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

/**
 * Optional output constraints requested by the caller.
 * Providers translate supported options into their respective API parameters.
 */
export type AiGenerationOptions = {
  /** Ollama-specific JSON schema used to constrain the structure of generated output. */
  responseSchema?: Record<string, unknown>;
  /** DeepSeek-specific response mode: JSON object output or unrestricted text output. */
  responseFormat?: 'json_object' | 'text';
};

export type NormilizedAiResponse = {
  data: unknown;
  metadata: AiGenerationMetadata;
};
