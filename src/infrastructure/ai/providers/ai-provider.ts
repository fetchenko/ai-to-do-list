import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';

export interface AIProvider {
  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;
}

export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === 'ollama') {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
