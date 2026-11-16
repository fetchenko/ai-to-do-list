import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLogResource as AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { StreamGeneration } from '@/infrastructure/ai/generations/stream-generation';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { subtaskToolSchema } from '@/infrastructure/ai/schema/subtask-tool.schema';
import { createAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';
import { normalizeApiError } from '@/infrastructure/ai/utils/normalize-api-error';
import { DbTaskForSubtaskGeneration } from '@/infrastructure/supabase/types/database-task.types';

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
    await aiGenerationLog?.fail({
      code: normalizeApiError(error).code,
    });

    await generationLock.release();

    throw error;
  }
}

export async function streamSubtasksForTask(input: {
  userId: string;
  task: DbTaskForSubtaskGeneration;
  provider: AIProvider;
  signal: AbortSignal;
}): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> {
  const generationLock = await acquireAiRequestLock(input.userId);

  let generationLog = null;

  try {
    const generationId = await createAiGenerationLog({
      userId: input.userId,
      taskId: input.task.id,
      feature: SUBTASK_GENERATION_FEATURE,
    });

    generationLog = generationId ? new AiGenerationLog(generationId) : null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
  }

  const prompt = taskDecomposerStreamPrompt(input.task.title);

  const generation = new StreamGeneration({
    prompt,
    tools: [createSubtaskTool],
    toolsEventSchema: subtaskToolSchema,
    provider: input.provider,
    signal: input.signal,
    generationLog,
    generationLock,
  });

  return generation.stream();
}
