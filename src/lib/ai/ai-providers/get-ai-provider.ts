import { DeepSeekProvider } from "./deek-seek-provider";
import { OllamaProvider } from "./ollama-provider";

export function getAIProvider() {
  if (process.env.AI_PROVIDER === "ollama") {
    return new OllamaProvider();
  }

  return new DeepSeekProvider();
}
