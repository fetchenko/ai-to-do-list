import { deepseekResponse } from '@tests/fixtures/deepseek.response';
import { describe, expect, it } from 'vitest';

import { normalizeDeepseekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';

describe('normalizeDeepseekResponse', () => {
  it('parses response content without applying a feature schema', () => {
    const result = normalizeDeepseekResponse(deepseekResponse as any);

    expect(result.data).toEqual({
      task_summary: 'Prompt the user to enter input through a user interface',
      subtasks: [
        {
          title: 'Build input form UI',
          description: expect.any(String),
        },
        expect.objectContaining({ title: expect.any(String) }),
      ],
    });

    expect(result.metadata.model).toBe('deepseek-v4-flash');

    expect(result.metadata.usage.inputTokens).toBe(292);
    expect(result.metadata.usage.outputTokens).toBe(387);
    expect(result.metadata.usage.totalTokens).toBe(679);

    expect(result.metadata.usage.reasoningTokens).toBe(257);

    expect(result.metadata.usage.cacheHitTokens).toBe(256);
    expect(result.metadata.usage.cacheMissTokens).toBe(36);
  });

  it('handles missing usage safely', () => {
    const input = {
      choices: [
        {
          message: {
            content: JSON.stringify({ arbitrary: 'payload' }),
          },
        },
      ],
    };

    const result = normalizeDeepseekResponse(input as any);

    expect(result.data).toEqual({ arbitrary: 'payload' });
    expect(result.metadata.usage.inputTokens).toBe(null);
    expect(result.metadata.usage.outputTokens).toBe(null);
  });

  it('throws on invalid JSON content', () => {
    const input = {
      choices: [
        {
          message: {
            content: 'NOT_JSON',
          },
        },
      ],
    };

    expect(() => normalizeDeepseekResponse(input as any)).toThrow();
  });
});
