import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeDeepseekResponse } from '@/infrastructure/ai/providers/deepseek/deepseek.normalize';
import { deepSeekResponseSchema } from '@/infrastructure/ai/providers/deepseek/deepseek.schema';
import { CombinedAiResponse } from '@/infrastructure/ai/types/ai.types';
import { parseResponseJson } from '@/infrastructure/ai/utils/response.utils';
import { aiEnv } from '@/shared/env/ai-env';
import { ResponseFormatError } from '@/shared/errors/app-error';

const DEFAULT_DEEPSEEK_QUOTA_LIMIT = 20;

export default class DeepSeekProvider implements AIProvider {
  quotaLimit = DEFAULT_DEEPSEEK_QUOTA_LIMIT;

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
}
