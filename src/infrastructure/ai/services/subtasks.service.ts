import { AiGenerationResource as AiGeneration } from '@/infrastructure/ai/generations/ai-generation';
import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLogResource as AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { SubtaskGenerationResource as SubtaskGeneration } from '@/infrastructure/ai/generations/subtask-generation';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { createAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';
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
  const lock = await acquireAiRequestLock(userId);

  let aiGenerationLog = null;

  try {
    const generationId = await createAiGenerationLog({
      userId,
      taskId: task.id,
      feature: 'generate-subtasks',
    });

    aiGenerationLog = generationId ? new AiGenerationLog(generationId) : null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
  }

  const aiGeneration = new AiGeneration(aiGenerationLog, lock);

  try {
    const prompt = taskDecomposerPrompt(task.title);
    const { data, metadata } = await provider.generate(prompt, signal);

    await aiGeneration.complete({ metadata });

    return { data };
  } catch (error) {
    await aiGeneration.fail({
      code: normalizeAiError(error).code,
    });

    throw error;
  }
}

export async function streamSubtasksForTask(input: {
  userId: string;
  task: TaskPreview;
  provider: AIProvider;
  signal: AbortSignal;
}) {
  const aiRequestLock = await acquireAiRequestLock(input.userId);

  let aiGenerationLog = null;

  try {
    const generationId = await createAiGenerationLog({
      userId: input.userId,
      taskId: input.task.id,
      feature: 'generate-subtasks',
    });

    aiGenerationLog = generationId ? new AiGenerationLog(generationId) : null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
  }

  const aiGeneration = new AiGeneration(aiGenerationLog, aiRequestLock);

  const generation = new SubtaskGeneration({
    generation: aiGeneration,
    task: input.task,
    provider: input.provider,
    signal: input.signal,
  });

  return generation.stream();
}
