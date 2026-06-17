import { getTaskForUser } from "../tasks/get-task";
import { createAiLog } from "./logs/create-log";
import { updateAiLog } from "./logs/update-log";
import { AiGenerationError } from "@/shared/errors/app-error";
import { getInitialAiLog, getSuccessAiLogs } from "./ai.helpers";
import { taskDecomposerPrompt } from "../prompts/task-decomposer";
import { getAIProvider } from "./ai-providers/ai-provider";

export async function generateSubtasksForTask({
  taskId,
  userId,
  signal,
}: {
  taskId: string;
  userId: string;
  signal: AbortSignal;
}) {
  const task = await getTaskForUser(taskId, userId);

  try {
    const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));

    const prompt = taskDecomposerPrompt(task.title);
    const provider = getAIProvider();

    const { data, aiLogs, raw } = await provider.generate(prompt, signal);

    if (aiLogId) {
      await updateAiLog(aiLogId, getSuccessAiLogs(aiLogs, raw));
    }

    return { data, aiLogId };
  } catch (err: unknown) {
    throw new AiGenerationError(`Failed to generate subtasks ${err}`);
  }
}
