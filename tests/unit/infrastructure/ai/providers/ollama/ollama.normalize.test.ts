import { mockOllamaResponse } from '@tests/fixtures/ollama.response';
import { describe, expect, it } from 'vitest';

import { normalizeOllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.normalize';

describe('normalizeOllamaResponse', () => {
  it('parses response content without applying a feature schema', () => {
    const result = normalizeOllamaResponse(mockOllamaResponse as any);

    expect(result.data).toEqual(
      JSON.parse(mockOllamaResponse.response)
    );
    expect(result.metadata.model).toBe(mockOllamaResponse.model);
    expect(result.metadata.usage.totalTokens).toBe(
      mockOllamaResponse.prompt_eval_count + mockOllamaResponse.eval_count
    );
  });

  it('throws on invalid JSON response', () => {
    const badInput = {
      response: 'NOT_VALID_JSON',
    };

    expect(() => normalizeOllamaResponse(badInput as any)).toThrow();
  });

  it('accepts valid JSON that does not match the subtasks schema', () => {
    const input = {
      response: JSON.stringify({ arbitrary: true }),
    };

    expect(normalizeOllamaResponse(input as any).data).toEqual({
      arbitrary: true,
    });
  });

  it('returns null when response field is null', () => {
    const input = {
      response: null,
    };

    expect(normalizeOllamaResponse(input as any).data).toBeNull();
  });
});
