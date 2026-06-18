import { AIProvider } from "../ai-provider";
import { checkAndParseResponseJson } from "../../ai.helpers";
import { CombinedAiResponse } from "../../ai.types";
import { DeepSeekResponseSchema } from "./deepseek.validation";
import { ResponseFormatError } from "@/shared/errors/app-error";
import { normalizeDeepseekResponse } from "./deepseek.normilize";

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

    const parsedResponse = await checkAndParseResponseJson(response);

    const { data, success } = DeepSeekResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError("Invalid format of AI response");
    }
    return {
      ...normalizeDeepseekResponse(data),
      raw: parsedResponse,
    };
  }
}
