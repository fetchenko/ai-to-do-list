import { DeepSeekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import {
  AiGenerationUsage,
  AiLogs,
  NormilizedAiResponse,
} from '@/infrastructure/ai/types/ai.types';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

export function normalizeDeepseekUsage(
  response: DeepSeekResponse
): AiGenerationUsage {
  const choice = response.choices?.[0];

  return {
    input_tokens: response.usage?.prompt_tokens ?? 0,
    output_tokens: response.usage?.completion_tokens ?? 0,
    total_tokens: response.usage?.total_tokens ?? 0,

    finish_reason: choice?.finish_reason ?? null,

    reasoning_tokens:
      response.usage?.completion_tokens_details?.reasoning_tokens ?? 0,

    cache_hit_tokens: response.usage?.prompt_cache_hit_tokens ?? 0,

    cache_miss_tokens: response.usage?.prompt_cache_miss_tokens ?? 0,
  };
}

export function normalizeDeepseekMetadata(response: DeepSeekResponse): AiLogs {
  const choice = response.choices?.[0];

  return {
    model: response.model ?? null,
    response: choice?.message?.content ?? null,

    usage: normalizeDeepseekUsage(response),
  };
}

export function normalizeDeepseekResponse(
  response: DeepSeekResponse
): NormilizedAiResponse {
  const choice = response.choices?.[0];

  return {
    data: subtasksResponseSchema.parse(JSON.parse(choice.message.content)),

    aiLogs: normalizeDeepseekMetadata(response),
  };
}
