import { OllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import {
  AiGenerationUsage,
  AiLogs,
  NormilizedAiResponse,
} from '@/infrastructure/ai/types/ai.types';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

export function normalizeOllamaResponse(
  response: OllamaResponse
): NormilizedAiResponse {
  return {
    data: subtasksResponseSchema.parse(JSON.parse(response.response)),
    aiLogs: normalizeOllamaMetadata(response),
  };
}

export function normalizeOllamaMetadata(response: OllamaResponse): AiLogs {
  return {
    model: response.model ?? null,
    response: response.response ?? null,
    usage: normalizeOllamaUsage(response),
  };
}

export function normalizeOllamaUsage(
  response: OllamaResponse
): AiGenerationUsage {
  return {
    input_tokens: response.prompt_eval_count ?? 0,
    output_tokens: response.eval_count ?? 0,
    total_tokens:
      (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),

    finish_reason: response.done_reason,

    reasoning_tokens: 0,
    cache_hit_tokens: 0,
    cache_miss_tokens: 0,

    duration_ms: response.total_duration
      ? Math.round(response.total_duration / 1_000_000)
      : null,
  };
}
