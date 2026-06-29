import { mockOllamaResponse } from '@tests/fixtures/ollama.response';
import { describe, expect, it } from 'vitest';

import { normalizeOllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.normalize';

describe('normalizeOllamaResponse', () => {
  it('correctly normalizes ollama response', () => {
    const result = normalizeOllamaResponse(mockOllamaResponse as any);

    expect(result.data.subtasks).toHaveLength(3);
    expect(result.aiLogs.model).toBe(mockOllamaResponse.model);
    expect(result.aiLogs.total_tokens).toBe(
      mockOllamaResponse.prompt_eval_count + mockOllamaResponse.eval_count
    );
  });

  it('throws on invalid JSON response', () => {
    const badInput = {
      response: 'NOT_VALID_JSON',
    };

    expect(() => normalizeOllamaResponse(badInput as any)).toThrow();
  });

  it('throws when schema validation fails', () => {
    const input = {
      response: JSON.stringify({
        invalid_field: true,
      }),
    };

    expect(() => normalizeOllamaResponse(input as any)).toThrow();
  });

  it('handles null response field', () => {
    const input = {
      response: null,
    };

    expect(() => normalizeOllamaResponse(input as any)).toThrow();
  });
});
