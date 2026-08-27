import { OllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import {
  AiGenerationMetadata,
  AiGenerationUsage,
  NormilizedAiResponse,
} from '@/infrastructure/ai/types/ai.types';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

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
    usage: normalizeOllamaUsage(response),
  };
}

export function normalizeOllamaUsage(
  response: OllamaResponse
): AiGenerationUsage {
  return {
    inputTokens: response.prompt_eval_count ?? 0,
    outputTokens: response.eval_count ?? 0,
    totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),

    reasoningTokens: 0,
    cacheHitTokens: 0,
    cacheMissTokens: 0,

    durationMs: response.total_duration
      ? Math.round(response.total_duration / 1_000_000)
      : null,
  };
}
