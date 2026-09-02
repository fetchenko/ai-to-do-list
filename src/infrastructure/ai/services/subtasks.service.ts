import { TaskPreview } from '@/features/tasks/types/database.types';
import { startSubtaskGeneration } from '@/infrastructure/ai/generations/start-subtask-generation';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  completeAiGenerationLog,
  createAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';

export async function generateSubtasksForTask({
  task,
  userId,
  signal,
  provider,
}: {
  task: TaskPreview;
  userId: string;
  signal: AbortSignal;
  provider: AIProvider;
}) {
  const aiLogId = await createAiGenerationLog({
    userId,
    taskId: task.id,
    feature: 'generate-subtasks',
  });
  const prompt = taskDecomposerPrompt(task.title);
  const { data, metadata, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await completeAiGenerationLog({ id: aiLogId, metadata, response: raw });
  }

  return { data, aiLogId };
}

export async function streamSubtasksForTask(input: {
  userId: string;
  task: TaskPreview;
  provider: AIProvider;
  signal: AbortSignal;
}) {
  const generation = await startSubtaskGeneration(input);

  return generation.stream();
}
