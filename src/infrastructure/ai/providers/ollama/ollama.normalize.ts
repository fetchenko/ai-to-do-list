import { OllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import {
  AiGenerationMetadata,
  AiGenerationUsage,
  NormilizedAiResponse,
} from '@/infrastructure/ai/types/ai.types';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

type OllamaUsageSource = Pick<
  OllamaResponse,
  'prompt_eval_count' | 'eval_count' | 'total_duration'
>;

export function normalizeOllamaResponse(
  response: OllamaResponse
): NormilizedAiResponse {
  return {
    data: subtasksResponseSchema.parse(JSON.parse(response.response)),
    metadata: normalizeOllamaMetadata(response),
  };
}

export function normalizeOllamaMetadata(
  response: OllamaResponse
): AiGenerationMetadata {
  return {
    model: response.model ?? null,
    response: response.response ?? null,
    finishReason: response.done_reason,
    providerGenerationId: null,
    usage: normalizeOllamaUsage(response),
  };
}

export function normalizeOllamaUsage(
  response: OllamaUsageSource
): AiGenerationUsage {
  return {
    inputTokens: response.prompt_eval_count ?? null,
    outputTokens: response.eval_count ?? null,
    totalTokens:
      response.prompt_eval_count !== undefined &&
      response.eval_count !== undefined
        ? response.prompt_eval_count + response.eval_count
        : null,

    reasoningTokens: 0,
    cacheHitTokens: 0,
    cacheMissTokens: 0,

    durationMs: response.total_duration
      ? Math.round(response.total_duration / 1_000_000)
      : null,
  };
}
