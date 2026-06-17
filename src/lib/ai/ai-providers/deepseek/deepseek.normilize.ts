import { SubtasksResponseSchema } from "@/lib/validation/task";
import { DeepSeekResponse } from "./deepseek.types";
import { NormilizedAiResponse } from "../../ai.types";

export function normalizeDeepseekResponse(
  response: DeepSeekResponse,
): NormilizedAiResponse {
  const choice = response.choices?.[0];

  return {
    data: SubtasksResponseSchema.parse(response.choices[0].message.content),

    aiLogs: {
      model: response.model ?? null,

      response: choice?.message?.content ?? null,

      input_tokens: response.usage?.prompt_tokens ?? 0,
      output_tokens: response.usage?.completion_tokens ?? 0,
      total_tokens: response.usage?.total_tokens ?? 0,

      finish_reason: choice?.finish_reason ?? null,
      provider_generation_id: response.id ?? null,

      reasoning_tokens:
        response.usage?.completion_tokens_details?.reasoning_tokens ?? 0,

      cache_hit_tokens: response.usage?.prompt_cache_hit_tokens ?? 0,

      cache_miss_tokens: response.usage?.prompt_cache_miss_tokens ?? 0,
    },
  };
}
