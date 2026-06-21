import { AIProvider } from "../ai-provider";
import { parseResponseJson } from "@/infrastructure/ai/helpers/ai.helpers";
import { normalizeOllamaResponse } from "./ollama.normilize";
import { CombinedAiResponse } from "../../types/ai.types";
import { ollamaChatResponseSchema } from "./ollama.validation";
import { ResponseFormatError } from "@/shared/errors/app-error";
import { subtasksResponseSchema } from "@/shared/validation/subtasks.validation";

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
        format: subtasksResponseSchema.toJSONSchema(),
      }),
    });

    const parsedResponse = await parseResponseJson(response);

    const { data, success } =
      ollamaChatResponseSchema.safeParse(parsedResponse);

    if (!success) {
      throw new ResponseFormatError("Invalid format of AI response");
    }

    return { ...normalizeOllamaResponse(data), raw: parsedResponse };
  }
}
