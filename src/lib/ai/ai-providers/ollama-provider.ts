import { subtasksSchema } from "@/lib/validation/task";
import { AIProvider } from "./ai-provider.types";

export class OllamaProvider implements AIProvider {
  async generate(prompt: string, signal?: AbortSignal) {
    return await fetch("http://localhost:11434/api/generate", {
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
  }
}
