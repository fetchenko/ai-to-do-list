import { TaskPreview } from '@/features/tasks/types/database.types';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  createAiLog,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import {
  getInitialAiLog,
  getSuccessAiLogs,
} from '@/infrastructure/ai/utils/ai-log.utils';

export async function generateSubtasksForTask({
  task,
  userId,
  signal,
}: {
  task: TaskPreview;
  userId: string;
  signal: AbortSignal;
}) {
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));

  const prompt = taskDecomposerPrompt(task.title);
  const provider = getAIProvider();

  const { data, aiLogs, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await updateAiLog(aiLogId, getSuccessAiLogs(aiLogs, raw));
  }

  return { data, aiLogId };
}
