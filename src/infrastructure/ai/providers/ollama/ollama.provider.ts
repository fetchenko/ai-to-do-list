import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeOllamaStream } from '@/infrastructure/ai/providers/ollama/ollama-stream.normalize';
import { normalizeOllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import { ollamaChatResponseSchema } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { parseResponseJson } from '@/infrastructure/ai/utils/response.utils';
import {
  AiEmptyResponseError,
  AiUnavailableError,
  ResponseFormatError,
} from '@/shared/errors/app-error';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'qwen3:8b';

export class OllamaProvider implements AIProvider {
  async generate(
    prompt: string,
    signal?: AbortSignal
  ): Promise<CombinedAiResponse> {
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

    const { data, success } =
      ollamaChatResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError('Invalid format of AI response');
    }

    return {
      ...normalizeOllamaResponse(data),
      raw: JSON.stringify(parsedResponse),
    };
  }

  async *stream(
    prompt: string,
    signal: AbortSignal
  ): AsyncIterable<AiStreamEvent> {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        tools: [createSubtaskTool],
        stream: true,
        think: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();

      throw new AiUnavailableError(body);
    }

    if (!response.body) {
      throw new AiEmptyResponseError('Ollama response has no body');
    }

    yield* normalizeOllamaStream(response.body);
  }
}
