import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { aiEnv } from '@/shared/env/ai-env';

export interface AIProvider {
  readonly quotaLimit?: number;

  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;

  stream(prompt: string, signal?: AbortSignal): AsyncIterable<AiStreamChunk>;
}

export function getAIProvider(): AIProvider {
  if (aiEnv.AI_PROVIDER === 'ollama') {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
