import { SubtasksResponse } from "@/types/tasks";
import { ErrorCode } from "@/shared/errors/code";

export type CombinedAiResponse = NormilizedAiResponse & { raw: string };

export type AiLogs = {
  model: string | null;
  response: string | null;

  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  finish_reason?: string | null;
  provider_generation_id?: string | null;

  reasoning_tokens?: number;
  cache_hit_tokens?: number;
  cache_miss_tokens?: number;
};

export type NormilizedAiResponse = {
  data: SubtasksResponse;
  aiLogs: AiLogs;
};
export interface AiErrorResult {
  success: false;
  code: ErrorCode;
  status: number;
  error?: string;
}
