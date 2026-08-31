import { TaskPreview } from '@/features/tasks/types/database.types';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  createAiLog,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import {
  getFailedAiLogs,
  getInitialAiLog,
  getSuccessAiLogs,
} from '@/infrastructure/ai/utils/ai-log.utils';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';

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
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));
  const prompt = taskDecomposerPrompt(task.title);
  const { data, metadata, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await updateAiLog(aiLogId, getSuccessAiLogs(metadata, raw));
  }

  return { data, aiLogId };
}

export async function* streamSubtasksForTask({
  task,
  userId,
  provider,
  signal,
}: {
  task: TaskPreview;
  userId: string;
  provider: AIProvider;
  signal: AbortSignal;
}): AsyncGenerator<AiStreamEvent> {
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));
  const prompt = taskDecomposerStreamPrompt(task.title);

  try {
    for await (const event of provider.stream(prompt, signal)) {
      if (signal.aborted) return;

      if (event.type === 'done' && aiLogId) {
        try {
          await updateAiLog(
            aiLogId,
            getSuccessAiLogs(event.metadata, event.metadata.response)
          );
        } catch {
          // Logging failure must not fail an otherwise successful generation.
        }
      }

      yield event;
    }
  } catch (error) {
    if (signal.aborted) return;

    const normalizedError = normalizeAiError(error);

    if (aiLogId) {
      try {
        await updateAiLog(aiLogId, getFailedAiLogs(normalizedError));
      } catch {
        // Logging failure must not replace the original generation error.
      }
    }

    yield {
      type: 'error',
      error: normalizedError,
    };
  }
}
