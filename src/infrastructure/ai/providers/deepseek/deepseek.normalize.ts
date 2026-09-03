import {
  DeepSeekResponse,
  DeepSeekUsage,
} from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import {
  AiGenerationMetadata,
  AiGenerationUsage,
  NormilizedAiResponse,
} from '@/infrastructure/ai/types/ai.types';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

export function normalizeDeepseekUsage(
  usage?: DeepSeekUsage | null
): AiGenerationUsage {
  return {
    inputTokens: usage?.prompt_tokens ?? null,
    outputTokens: usage?.completion_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,

    reasoningTokens: usage?.completion_tokens_details?.reasoning_tokens ?? null,

    cacheHitTokens: usage?.prompt_cache_hit_tokens ?? null,

    cacheMissTokens: usage?.prompt_cache_miss_tokens ?? null,
  };
}

export function normalizeDeepseekMetadata(
  response: DeepSeekResponse
): AiGenerationMetadata {
  const choice = response.choices?.[0];

  return {
    model: response.model ?? null,
    response: choice?.message?.content ?? null,
    finishReason: choice?.finish_reason ?? null,
    providerGenerationId: response.id || null,

    usage: normalizeDeepseekUsage(response.usage),
  };
}

export function normalizeDeepseekResponse(
  response: DeepSeekResponse
): NormilizedAiResponse {
  const choice = response.choices?.[0];

  return {
    data: subtasksResponseSchema.parse(JSON.parse(choice.message.content)),

    metadata: normalizeDeepseekMetadata(response),
  };
}
