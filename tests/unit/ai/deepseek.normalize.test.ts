import { describe, it, expect } from "vitest";
import { normalizeDeepseekResponse } from "@/infrastructure/ai/providers/deepseek/deepseek.normalize";
import { deepseekResponse } from "@tests/fixtures/deepseek.response";

describe("normalizeDeepseekResponse", () => {
  it("correctly normalizes deepseek response", () => {
    const result = normalizeDeepseekResponse(deepseekResponse as any);

    expect(result.data.task_summary).toBe(
      "Prompt the user to enter input through a user interface",
    );

    expect(result.data.subtasks).toHaveLength(2);
    expect(result.data.subtasks[0].title).toBe("Build input form UI");

    expect(result.aiLogs.model).toBe("deepseek-v4-flash");

    expect(result.aiLogs.input_tokens).toBe(292);
    expect(result.aiLogs.output_tokens).toBe(387);
    expect(result.aiLogs.total_tokens).toBe(679);

    expect(result.aiLogs.reasoning_tokens).toBe(257);

    expect(result.aiLogs.cache_hit_tokens).toBe(256);
    expect(result.aiLogs.cache_miss_tokens).toBe(36);

    expect(result.aiLogs.provider_generation_id).toBe(deepseekResponse.id);
  });

  it("handles missing usage safely", () => {
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

    expect(result.aiLogs.input_tokens).toBe(0);
    expect(result.aiLogs.output_tokens).toBe(0);
  });

  it("throws on invalid JSON content", () => {
    const input = {
      choices: [
        {
          message: {
            content: "NOT_JSON",
          },
        },
      ],
    };

    expect(() => normalizeDeepseekResponse(input as any)).toThrow();
  });
});
