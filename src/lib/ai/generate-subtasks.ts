import { taskDecomposerPrompt } from "../prompts/task-decomposer";
import { AiGenerationError } from "@/shared/errors/app-error";
import { getAIProvider } from "./ai-providers/get-ai-provider";
import { handleAiResponse } from "./ai.helpers";

export async function generateSubtasks(title: string, signal: AbortSignal) {
  const prompt = taskDecomposerPrompt(title);
  const provider = getAIProvider();

  try {
    const response = await provider.generate(prompt, signal);
    const { raw, parsedData } = await handleAiResponse(response);

    return { raw, parsedData, prompt };
  } catch (error) {
    throw new AiGenerationError(JSON.stringify(error));
  }
}
