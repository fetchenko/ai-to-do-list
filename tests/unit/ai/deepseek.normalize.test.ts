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

    expect(result.aiLogs.model).toBe('deepseek-v4-flash');

    expect(result.aiLogs.usage.input_tokens).toBe(292);
    expect(result.aiLogs.usage.output_tokens).toBe(387);
    expect(result.aiLogs.usage.total_tokens).toBe(679);

    expect(result.aiLogs.usage.reasoning_tokens).toBe(257);

    expect(result.aiLogs.usage.cache_hit_tokens).toBe(256);
    expect(result.aiLogs.usage.cache_miss_tokens).toBe(36);
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

    expect(result.aiLogs.usage.input_tokens).toBe(0);
    expect(result.aiLogs.usage.output_tokens).toBe(0);
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
