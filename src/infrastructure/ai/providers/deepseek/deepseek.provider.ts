import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeDeepSeekStream } from '@/infrastructure/ai/providers/deepseek/deepseek-stream.normalize';
import { normalizeDeepseekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import { deepSeekResponseSchema } from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { parseResponseJson } from '@/infrastructure/ai/utils/parse-response-json';
import { aiEnv } from '@/shared/env/ai-env';
import {
  AiEmptyResponseError,
  AiInvalidResponseFormat,
  AiUnavailableError,
} from '@/shared/errors/ai-app-error';

const DEFAULT_DEEPSEEK_QUOTA_LIMIT = 20;
const DEEPSEEK_MODEL = 'deepseek-v4-flash';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

export default class DeepSeekProvider implements AIProvider {
  quotaLimit = DEFAULT_DEEPSEEK_QUOTA_LIMIT;

  async generate(
    prompt: string,
    signal?: AbortSignal
  ): Promise<CombinedAiResponse> {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiEnv.DEEPSEEK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
      signal,
    });

    const parsedResponse = await parseResponseJson(response);

    const result = deepSeekResponseSchema.safeParse(parsedResponse);

    if (!result.success) {
      throw new AiInvalidResponseFormat(
        `Invalid format of Deepseek response: ${result.error}`
      );
    }

    return normalizeDeepseekResponse(result.data);
  }

  async *stream(
    prompt: string,
    signal: AbortSignal
  ): AsyncIterable<AiStreamEvent> {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiEnv.DEEPSEEK_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: true,
        stream_options: {
          include_usage: true,
        },
        tools: [createSubtaskTool],
        tool_choice: 'auto',
      }),
      signal,
    });

    if (!response.ok) {
      const body = await response.text();

      throw new AiUnavailableError(body);
    }

    if (!response.body) {
      throw new AiEmptyResponseError('DeepSeek response has no body');
    }

    yield* normalizeDeepSeekStream(response.body);
  }
}
