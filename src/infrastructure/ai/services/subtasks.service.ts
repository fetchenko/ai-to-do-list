import {
  getInitialAiLog,
  getSuccessAiLogs,
} from "@/infrastructure/ai/helpers/ai.helpers";
import { taskDecomposerPrompt } from "../prompts/task-decomposer";
import { getAIProvider } from "@/infrastructure/ai/providers/ai-provider";
import { getTaskForUser } from "@/features/tasks/repository/tasks.admin.repository";
import {
  createAiLog,
  updateAiLog,
} from "@/infrastructure/ai/services/ai-log.admin.service";

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

  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));

  const prompt = taskDecomposerPrompt(task.title);
  const provider = getAIProvider();

  const { data, aiLogs, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await updateAiLog(aiLogId, getSuccessAiLogs(aiLogs, raw));
  }

  return { data, aiLogId };
}
