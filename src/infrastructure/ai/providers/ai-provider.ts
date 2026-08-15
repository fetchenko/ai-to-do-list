import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { AIProviderStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { aiEnv } from '@/shared/env/ai-env';

export interface AIProvider {
  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;

  generateStream(
    prompt: string,
    signal?: AbortSignal
  ): AsyncIterable<AIProviderStreamEvent>;
}

export function getAIProvider(): AIProvider {
  if (aiEnv.AI_PROVIDER === 'ollama') {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
