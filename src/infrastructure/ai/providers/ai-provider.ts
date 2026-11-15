import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiTool } from '@/infrastructure/ai/types/ai-tool.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { aiEnv } from '@/shared/env/ai-env';

export interface AIProvider {
  readonly quotaLimit?: number;

  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;

  stream(
    prompt: string,
    tool: AiTool,
    signal: AbortSignal
  ): AsyncIterable<AiStreamEvent>;
}

export function getAIProvider(): AIProvider {
  if (aiEnv.AI_PROVIDER === 'ollama') return new OllamaProvider();
  return new DeepSeekProvider();
}
