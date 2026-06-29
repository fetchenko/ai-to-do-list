import { parseResponseJson } from '@/infrastructure/ai/helpers/ai.helpers';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeOllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import { ollamaChatResponseSchema } from '@/infrastructure/ai/providers/ollama/ollama.validation';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import * as appError from '@/shared/errors/app-error';
import { subtasksResponseSchema } from '@/shared/validation/subtasks.validation';

export class OllamaProvider implements AIProvider {
  async generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        prompt,
        model: 'qwen2.5-coder:1.5b',
        stream: false,
        format: subtasksResponseSchema.toJSONSchema(),
      }),
    });

    const parsedResponse = await parseResponseJson(response);

    const { data, success } = ollamaChatResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new appError.ResponseFormatError('Invalid format of AI response');
    }

    return { ...normalizeOllamaResponse(data), raw: parsedResponse };
  }
}
