import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { DbAiGenerationUpdate } from '@/shared/types/database.types';

export function mapAiGenerationMetadataToUpdate(
  metadata: AiGenerationMetadata
): DbAiGenerationUpdate {
  const { usage, finishReason, response, model, providerGenerationId } =
    metadata;

  return {
    model: model,
    response: response,
    finish_reason: finishReason,
    provider_generation_id: providerGenerationId,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    reasoning_tokens: usage.reasoningTokens ?? null,
    cache_hit_tokens: usage.cacheHitTokens ?? null,
    cache_miss_tokens: usage.cacheMissTokens ?? null,
    duration_ms: usage.durationMs ?? null,
  };
}
