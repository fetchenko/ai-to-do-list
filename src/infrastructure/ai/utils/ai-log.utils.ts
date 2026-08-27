import {
  AiErrorResult,
  AiGenerationMetadata,
} from '@/infrastructure/ai/types/ai.types';

export function getInitialAiLog(userId: string, taskId: string) {
  return {
    task_id: taskId,
    user_id: userId,
    feature: 'generate-subtasks',
    status: 'pending',
    started_at: new Date().toISOString(),
  };
}

export function getSuccessAiLogs(
  metadataUpdates: AiGenerationMetadata,
  raw: string | null
) {
  const { model, finishReason, providerGenerationId, usage } = metadataUpdates;

  return {
    model,
    response: raw,
    finish_reason: finishReason,
    provider_generation_id: providerGenerationId,

    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    reasoning_tokens: usage.reasoningTokens,
    cache_hit_tokens: usage.cacheHitTokens,
    cache_miss_tokens: usage.cacheMissTokens,
    duration_ms: usage.durationMs,

    status: 'success',
    finished_at: new Date().toISOString(),
  };
}

export function getFailedAiLogs(error: Omit<AiErrorResult, 'status'>) {
  return {
    status: 'failed',
    finished_at: new Date().toISOString(),
    error_code: error.code,
  };
}
