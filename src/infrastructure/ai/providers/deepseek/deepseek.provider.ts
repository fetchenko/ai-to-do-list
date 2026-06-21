import { AIProvider } from "../ai-provider";
import { parseResponseJson } from "@/infrastructure/ai/helpers/ai.helpers";
import { CombinedAiResponse } from "@/infrastructure/ai/types/ai.types";
import { deepSeekResponseSchema } from "./deepseek.validation";
import { ResponseFormatError } from "@/shared/errors/app-error";
import { normalizeDeepseekResponse } from "./deepseek.normalize";

export class DeepSeekProvider implements AIProvider {
  async generate(
    prompt: string,
    signal?: AbortSignal,
  ): Promise<CombinedAiResponse> {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-v4-flash",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        response_format: { type: "json_object" },
        temperature: 0.7,
      }),
      signal,
    });

    const parsedResponse = await parseResponseJson(response);

    const { data, success } = deepSeekResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError("Invalid format of AI response");
    }
    return {
      ...normalizeDeepseekResponse(data),
      raw: parsedResponse,
    };
  }
}
