import { streamAiGeneration } from '@/infrastructure/ai/services/ai-generation.service';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  createSubtaskGenerationPrompt,
  subtaskGenerationTool,
} from '@/features/tasks/ai/subtask-generation';
import { DbTaskForSubtaskGeneration } from '@/infrastructure/supabase/types/database-task.types';

export function streamSubtasksForTask(input: {
  userId: string;
  task: DbTaskForSubtaskGeneration;
  provider: AIProvider;
  signal: AbortSignal;
}) {
  return streamAiGeneration({
    userId: input.userId,
    taskId: input.task.id,
    feature: 'generate-subtasks',
    prompt: createSubtaskGenerationPrompt(input.task.title),
    tool: subtaskGenerationTool,
    provider: input.provider,
    signal: input.signal,
  });
}
