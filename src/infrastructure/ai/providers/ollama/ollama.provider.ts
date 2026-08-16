import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeOllamaResponse } from '@/infrastructure/ai/providers/ollama/ollama.normalize';
import { ollamaChatResponseSchema } from '@/infrastructure/ai/providers/ollama/ollama.schema';
import { AIProviderStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { parseResponseJson } from '@/infrastructure/ai/utils/response.utils';
import { readStreamLines } from '@/infrastructure/ai/utils/stream.utils';
import * as appError from '@/shared/errors/app-error';
import { subtasksResponseSchema } from '@/shared/schema/subtasks.schema';

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
      throw new appError.ResponseFormatError('Invalid format of AI response');
    }

    return {
      ...normalizeOllamaResponse(data),
      raw: JSON.stringify(parsedResponse),
    };
  }

  async *generateStream(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<AIProviderStreamEvent> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        prompt,
        model: 'qwen2.5-coder:1.5b',
        stream: true,
        format: subtasksResponseSchema.toJSONSchema(),
      }),
    });

    if (!response.ok) {
      await parseResponseJson(response);
      throw new appError.AiGenerationError('Failed to start AI stream');
    }

    if (!response.body) {
      throw new appError.ResponseFormatError('AI stream has no response body');
    }

    let content = '';
    let finalResponse: {
      model: string;
      created_at: string;
      response: string;
      done: boolean;
      done_reason: string;
      context?: number[];
      total_duration?: number;
      load_duration?: number;
      prompt_eval_count?: number;
      prompt_eval_duration?: number;
      eval_count?: number;
      eval_duration?: number;
    } | null = null;

    for await (const line of readStreamLines(response.body)) {
      const chunk = JSON.parse(line);

      const { data, success } = ollamaChatResponseSchema.safeParse(chunk);

      if (!success) {
        throw new appError.ResponseFormatError('Invalid AI stream chunk');
      }

      if (data.response) {
        content += data.response;
        yield { type: 'content', content: data.response };
      }

      if (data.done) {
        finalResponse = {
          ...data,
          response: content,
        };
      }
    }

    if (!finalResponse) {
      throw new appError.ResponseFormatError('AI stream did not complete');
    }

    yield {
      type: 'complete',
      response: {
        ...normalizeOllamaResponse(finalResponse),
        raw: JSON.stringify(finalResponse),
      },
    };
  }
}
