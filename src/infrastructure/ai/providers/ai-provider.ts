import { CombinedAiResponse } from "@/infrastructure/ai/types/ai.types";
import { DeepSeekProvider } from "./deepseek/deekseek.provider";
import { OllamaProvider } from "./ollama/ollama.provider";

export interface AIProvider {
  generate(prompt: string, signal?: AbortSignal): Promise<CombinedAiResponse>;
}

export function getAIProvider(): AIProvider {
  if (process.env.AI_PROVIDER === "ollama") {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
