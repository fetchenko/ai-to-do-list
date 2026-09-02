import { startAiGeneration } from '@/infrastructure/ai/generations/start-ai-generation';
import {
  SubtaskGeneration,
  SubtaskGenerationResource,
} from '@/infrastructure/ai/generations/subtask-generation-resource';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { TaskPreview } from '@/shared/types/database.types';

export async function startSubtaskGeneration(input: {
  userId: string;
  task: TaskPreview;
  provider: AIProvider;
  signal: AbortSignal;
}): Promise<SubtaskGeneration> {
  const generation = await startAiGeneration({
    userId: input.userId,
    taskId: input.task.id,
    feature: 'generate-subtasks',
  });

  return new SubtaskGenerationResource({
    generation,
    task: input.task,
    provider: input.provider,
    signal: input.signal,
  });
}
