import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLogResource as AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { createAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { DbTaskForSubtaskGeneration } from '@/infrastructure/supabase/types/database-task.types';
import {
  createSubtaskGenerationPrompt,
  subtaskGenerationTool,
} from '@/features/tasks/ai/subtask-generation';

const SUBTASK_GENERATION_FEATURE = 'generate-subtasks';

export async function generateSubtasksForTask({
  task,
  userId,
  signal,
  provider,
}: {
  task: DbTaskForSubtaskGeneration;
  userId: string;
  signal: AbortSignal;
  provider: AIProvider;
}) {
  const generationLock = await acquireAiRequestLock(userId);
  let aiGenerationLog = null;

  try {
    const generationId = await createAiGenerationLog({
      userId,
      taskId: task.id,
      feature: SUBTASK_GENERATION_FEATURE,
    });
    aiGenerationLog = generationId ? new AiGenerationLog(generationId) : null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
  }

  try {
    const prompt = taskDecomposerPrompt(task.title);
    const { data, metadata } = await provider.generate(prompt, signal);
    await aiGenerationLog?.complete({ metadata });
    await generationLock.release();
    return { data };
  } catch (error) {
    await aiGenerationLog?.fail({ code: normalizeApiError(error).code });
    await generationLock.release();
    throw error;
  }
}

