import { AiGenerationUsage } from '@/infrastructure/ai/types/ai.types';
import { DbAiGenerationUpdate } from '@/shared/types/database.types';

export function mapAiGenerationUsageToUpdate(
  usage: AiGenerationUsage
): Pick<
  DbAiGenerationUpdate,
  | 'input_tokens'
  | 'output_tokens'
  | 'total_tokens'
  | 'reasoning_tokens'
  | 'cache_hit_tokens'
  | 'cache_miss_tokens'
  | 'duration_ms'
> {
  return {
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    reasoning_tokens: usage.reasoningTokens ?? null,
    cache_hit_tokens: usage.cacheHitTokens ?? null,
    cache_miss_tokens: usage.cacheMissTokens ?? null,
    duration_ms: usage.durationMs ?? null,
  };
}
