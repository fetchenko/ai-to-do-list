import { tryCreateAiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { startSubtaskGeneration } from '@/infrastructure/ai/generations/start-subtask-generation';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeAiError } from '@/infrastructure/ai/utils/normalize-ai-error';
import { TaskPreview } from '@/shared/types/database.types';

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
  const log = await tryCreateAiGenerationLog({
    feature: 'generate-subtasks',
    taskId: task.id,
    userId: userId,
  });

  try {
    const prompt = taskDecomposerPrompt(task.title);
    const { data, metadata, raw } = await provider.generate(prompt, signal);

    if (log) {
      await log.complete({
        metadata: metadata,
        response: raw,
      });
    }

    return { data };
  } catch (error) {
    if (log) {
      await log.fail({
        code: normalizeAiError(error).code,
      });
    }

    throw error;
  }
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
