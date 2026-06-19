import { subtasksSchema } from "@/lib/validation/task";
import { AIProvider } from "../ai-provider";
import { parseResponseJson } from "../../ai.helpers";
import { normalizeOllamaResponse } from "./ollama.normilize";
import { CombinedAiResponse } from "../../ai.types";
import { OllamaChatResponseSchema } from "./ollama.validation";
import { ResponseFormatError } from "@/shared/errors/app-error";

export class OllamaProvider implements AIProvider {
  async generate(
    prompt: string,
    signal?: AbortSignal,
  ): Promise<CombinedAiResponse> {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal,
      body: JSON.stringify({
        prompt,
        model: "qwen2.5-coder:1.5b",
        stream: false,
        format: subtasksSchema.toJSONSchema(),
      }),
    });

    const parsedResponse = await parseResponseJson(response);

    const { data, success } =
      OllamaChatResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError("Invalid format of AI response");
    }

    return { ...normalizeOllamaResponse(data), raw: parsedResponse };
  }
}
