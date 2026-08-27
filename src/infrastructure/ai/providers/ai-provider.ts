import DeepSeekProvider from '@/infrastructure/ai/providers/deepseek/deepseek.provider';
import { OllamaProvider } from '@/infrastructure/ai/providers/ollama/ollama.provider';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { aiEnv } from '@/shared/env/ai-env';

/**
 * Streaming contract:
 *
 * - Providers yield semantic AI chunks on successful generation.
 * - Provider/API/transport/parsing errors are thrown.
 * - The provider is responsible for translating its native
 *   streaming format into the common AiStreamEvent format.
 * - The service layer is responsible for logging the failure
 *   and converting it into a client-safe stream error.
 *
 * A stream is considered successful only when a `done` chunk
 * has been yielded.
 */
export interface AIProvider {
  readonly quotaLimit?: number;

  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;

  stream(prompt: string, signal?: AbortSignal): AsyncIterable<AiStreamEvent>;
}

export function getAIProvider(): AIProvider {
  if (aiEnv.AI_PROVIDER === 'ollama') {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
