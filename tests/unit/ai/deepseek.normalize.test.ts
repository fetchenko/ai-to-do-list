import { deepseekResponse } from '@tests/fixtures/deepseek.response';
import { describe, expect, it } from 'vitest';

import { normalizeDeepseekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';

describe('normalizeDeepseekResponse', () => {
  it('correctly normalizes deepseek response', () => {
    const result = normalizeDeepseekResponse(deepseekResponse as any);

    expect(result.data.task_summary).toBe(
      'Prompt the user to enter input through a user interface'
    );

    expect(result.data.subtasks).toHaveLength(2);
    expect(result.data.subtasks[0].title).toBe('Build input form UI');

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
            content: JSON.stringify({ subtasks: [] }),
          },
        },
      ],
    };

    const result = normalizeDeepseekResponse(input as any);

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
