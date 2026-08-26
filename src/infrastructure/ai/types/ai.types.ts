import { ErrorCode } from '@/shared/errors/code';
import { SubtasksResponse } from '@/shared/schema/subtasks.schema';

export type CombinedAiResponse = NormilizedAiResponse & { raw: string };

export type AiGenerationUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;

  finish_reason?: string | null;
  provider_generation_id?: string | null;

  reasoning_tokens?: number | null;
  cache_hit_tokens?: number | null;
  cache_miss_tokens?: number | null;
  duration_ms?: number | null;
};

export type AiLogs = {
  model: string | null;
  response: string | null;
  usage: AiGenerationUsage;
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
