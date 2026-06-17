import { SubtasksResponseSchema } from "@/lib/validation/task";
import { OllamaResponse } from "./ollama.types";
import { NormilizedAiResponse } from "../../ai.types";

export function normalizeOllamaResponse(
  response: OllamaResponse,
): NormilizedAiResponse {
  return {
    data: SubtasksResponseSchema.parse(JSON.parse(response.response)),
    aiLogs: {
      model: response.model ?? null,

      response: response.response ?? null,

      input_tokens: response.prompt_eval_count ?? 0,
      output_tokens: response.eval_count ?? 0,
      total_tokens:
        (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),

      finish_reason: response.done_reason,
      provider_generation_id: null,

      reasoning_tokens: 0,
      cache_hit_tokens: 0,
      cache_miss_tokens: 0,
    },
  };
}
