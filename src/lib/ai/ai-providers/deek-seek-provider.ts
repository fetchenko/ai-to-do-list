import { subtasksSchema } from "@/lib/validation/task";
import { AIProvider } from "./ai-provider.types";

export class DeepSeekProvider implements AIProvider {
  async generate(prompt: string, signal?: AbortSignal) {
    return await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        stream: false, // todo: check deep seek api
        format: subtasksSchema.toJSONSchema(),
      }),
      signal,
    });
  }
}
