import { TaskPreview } from '@/features/tasks/types/database.types';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { releaseRequestLock } from '@/infrastructure/ai/services/ai-lock.admin.service';
import {
  createAiLog,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import {
  getInitialAiLog,
  getSuccessAiLogs,
} from '@/infrastructure/ai/utils/ai-log.utils';
import { getFailedAiLogs } from '@/infrastructure/ai/utils/ai-log.utils';

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

  const { data, aiLogs, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await updateAiLog(aiLogId, getSuccessAiLogs(aiLogs, raw));
  }

  return { data, aiLogId };
}

export async function streamSubtasksForTask({
  task,
  userId,
  provider,
}: {
  task: TaskPreview;
  userId: string;
  provider: AIProvider;
}) {
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));

  const signal = AbortSignal.timeout(600_000);

  const encoder = new TextEncoder();
  const prompt = taskDecomposerStreamPrompt(task.title);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of provider.stream(prompt, signal)) {
          if (chunk.type === 'subtask') {
            controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
          }

          if (chunk.type === 'done') {
            if (aiLogId) {
              await updateAiLog(
                aiLogId,
                getSuccessAiLogs(chunk.metadata, chunk.metadata.response)
              );
            }
          }
        }

        controller.close();
      } catch (err) {
        const { status, ...error } = normalizeAiError(err);

        if (aiLogId) {
          await updateAiLog(aiLogId, getFailedAiLogs(error));
        }

        controller.error(err);
      } finally {
        await releaseRequestLock(userId);
      }
    },
  });

  return { stream, aiLogId };
}
