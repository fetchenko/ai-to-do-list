/**
 * Provider-independent contract for one generated item.
 * Features decide what the data represents.
 */
export type AiGenerationItem = {
  data: string;
  description: string;
};

/**
 * Provider-neutral function tool configuration passed into AIProvider.stream.
 */
export type AiTool = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};
