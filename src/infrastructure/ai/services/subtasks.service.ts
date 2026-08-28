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

  const { data, metadata, raw } = await provider.generate(prompt, signal);

  if (aiLogId) {
    await updateAiLog(aiLogId, getSuccessAiLogs(metadata, raw));
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
        for await (const event of provider.stream(prompt, signal)) {
          if (event.type === 'subtask') {
            controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
          }

          if (event.type === 'done') {
            if (aiLogId) {
              try {
                await updateAiLog(
                  aiLogId,
                  getSuccessAiLogs(event.metadata, event.metadata.response)
                );
              } catch {
                // Logging failure must not fail an otherwise successful generation.
              }
            }
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'done' }) + '\n')
            );
          }
        }

        controller.close();
      } catch (error) {
        const normalizedError = normalizeAiError(error);

        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: 'error', error: normalizedError }) + '\n'
          )
        );

        controller.close();

        try {
          if (aiLogId) {
            await updateAiLog(aiLogId, getFailedAiLogs(normalizedError));
          }
        } catch {
          // Logging failure must not fail an otherwise successful generation.
        }
      } finally {
        await releaseRequestLock(userId);
      }
    },
  });

  return { stream, aiLogId };
}
