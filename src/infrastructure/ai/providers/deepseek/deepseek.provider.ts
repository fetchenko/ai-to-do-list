import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeDeepseekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import { deepSeekResponseSchema } from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { AIProviderStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { readStreamLines } from '@/infrastructure/ai/utils/stream.utils';
import { parseResponseJson } from '@/infrastructure/ai/utils/response.utils';
import { aiEnv } from '@/shared/env/ai-env';
import { ResponseFormatError } from '@/shared/errors/app-error';

export default class DeepSeekProvider implements AIProvider {
  async generate(
    prompt: string,
    signal?: AbortSignal
  ): Promise<CombinedAiResponse> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiEnv.DEEPSEEK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      signal,
    });

    const parsedResponse = await parseResponseJson(response);

    const { data, success } = deepSeekResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError('Invalid format of AI response');
    }
    return {
      ...normalizeDeepseekResponse(data),
      raw: JSON.stringify(parsedResponse),
    };
  }

  async *generateStream(
    prompt: string,
    signal?: AbortSignal
  ): AsyncGenerator<AIProviderStreamEvent> {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiEnv.DEEPSEEK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        stream_options: { include_usage: true },
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      signal,
    });

    if (!response.ok) {
      await parseResponseJson(response);
      throw new ResponseFormatError('Failed to start AI stream');
    }

    if (!response.body) {
      throw new ResponseFormatError('AI stream has no response body');
    }

    let content = '';
    let id: string | undefined;
    let model: string | undefined;
    let finishReason: string | undefined;
    let usage:
      | {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
          prompt_cache_hit_tokens?: number;
          prompt_cache_miss_tokens?: number;
          completion_tokens_details?: { reasoning_tokens?: number };
        }
      | undefined;

    for await (const line of readStreamLines(response.body)) {
      const dataLine = line.startsWith('data:')
        ? line.slice('data:'.length).trim()
        : line;

      if (dataLine === '[DONE]') {
        continue;
      }

      const chunk = JSON.parse(dataLine) as {
        id?: string;
        model?: string;
        choices?: Array<{
          delta?: { content?: string };
          finish_reason?: string | null;
        }>;
        usage?: typeof usage;
      };

      id ??= chunk.id;
      model ??= chunk.model;
      usage = chunk.usage ?? usage;

      const choice = chunk.choices?.[0];
      const delta = choice?.delta?.content;

      if (choice?.finish_reason) {
        finishReason = choice.finish_reason;
      }

      if (delta) {
        content += delta;
        yield { type: 'content', content: delta };
      }
    }

    const finalResponse = {
      id,
      model,
      choices: [
        {
          finish_reason: finishReason,
          message: { content },
        },
      ],
      usage,
    };

    const { data, success } = deepSeekResponseSchema.safeParse(finalResponse);

    if (!success) {
      throw new ResponseFormatError('Invalid format of AI response');
    }

    yield {
      type: 'complete',
      response: {
        ...normalizeDeepseekResponse(data),
        raw: JSON.stringify(finalResponse),
      },
    };
  }
}
