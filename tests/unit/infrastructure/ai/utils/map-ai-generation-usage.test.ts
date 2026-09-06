import { describe, expect, it } from 'vitest';

import { mapAiGenerationMetadataToUpdate } from '@/infrastructure/ai/utils/map-ai-generation-usage';

describe('mapAiGenerationMetadataToUpdate', () => {
  it('maps generation metadata to database fields', () => {
    expect(
      mapAiGenerationMetadataToUpdate({
        model: 'deepseek-v4-flash',
        response: '[{"title":"Test"}]',
        finishReason: 'tool_calls',
        providerGenerationId: 'generation-123',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
          reasoningTokens: 4,
          cacheHitTokens: 5,
          cacheMissTokens: 1,
          durationMs: 250,
        },
      })
    ).toEqual({
      model: 'deepseek-v4-flash',
      response: '[{"title":"Test"}]',
      finish_reason: 'tool_calls',
      provider_generation_id: 'generation-123',
      input_tokens: 10,
      output_tokens: 20,
      total_tokens: 30,
      reasoning_tokens: 4,
      cache_hit_tokens: 5,
      cache_miss_tokens: 1,
      duration_ms: 250,
    });
  });

  it('maps omitted optional usage values to null', () => {
    expect(
      mapAiGenerationMetadataToUpdate({
        model: null,
        response: null,
        usage: { inputTokens: null, outputTokens: null, totalTokens: null },
      })
    ).toEqual({
      model: null,
      response: null,
      finish_reason: undefined,
      provider_generation_id: undefined,
      input_tokens: null,
      output_tokens: null,
      total_tokens: null,
      reasoning_tokens: null,
      cache_hit_tokens: null,
      cache_miss_tokens: null,
      duration_ms: null,
    });
  });
});
