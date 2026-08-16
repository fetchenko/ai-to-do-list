import { TaskPreview } from '@/features/tasks/types/database.types';
import { taskDecomposerPrompt } from '@/infrastructure/ai/prompts/task-decomposer';
import { getAIProvider } from '@/infrastructure/ai/providers/ai-provider';
import {
  createAiLog,
  updateAiLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import {
  getFailedAiLogs,
  getInitialAiLog,
  getSuccessAiLogs,
} from '@/infrastructure/ai/utils/ai-log.utils';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { SubtaskStreamParser } from '@/infrastructure/ai/utils/subtask-stream.parser';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function generateSubtasksForTask({
  task,
  userId,
  signal,
}: {
  task: TaskPreview;
  userId: string;
  signal: AbortSignal;
}) {
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));

  try {
    const prompt = taskDecomposerPrompt(task.title);
    const provider = getAIProvider();

    const { data, aiLogs, raw } = await provider.generate(prompt, signal);

    if (aiLogId) {
      await updateAiLog(aiLogId, getSuccessAiLogs(aiLogs, raw));
    }

    return { data, aiLogId };
  } catch (error) {
    if (aiLogId) {
      const { status: _status, ...normalizedError } = normalizeAiError(error);
      await updateAiLog(aiLogId, getFailedAiLogs(normalizedError));
    }

    throw error;
  }
}

export type SubtaskGenerationEvent =
  | {
      type: 'subtask';
      subtask: {
        title: string;
        description?: string;
      };
    }
  | {
      type: 'done';
    };

export async function* generateSubtasksStream({
  task,
  userId,
  signal,
}: {
  task: TaskPreview;
  userId: string;
  signal: AbortSignal;
}): AsyncGenerator<SubtaskGenerationEvent> {
  const aiLogId = await createAiLog(getInitialAiLog(userId, task.id));
  const parser = new SubtaskStreamParser();
  let emittedSubtasks = 0;

  try {
    const prompt = taskDecomposerPrompt(task.title);
    const provider = getAIProvider();

    for await (const event of provider.generateStream(prompt, signal)) {
      if (event.type === 'content') {
        for (const subtask of parser.push(event.content)) {
          emittedSubtasks += 1;
          yield { type: 'subtask', subtask };
        }

        continue;
      }

      parser.finish();

      const subtasks = event.response.data.subtasks;
      if (!subtasks.length || emittedSubtasks === 0) {
        throw new AppError(
          ErrorCode.AI_EMPTY_RESPONSE,
          ErrorHttpStatus[ErrorCode.AI_EMPTY_RESPONSE],
          'No meaningful subtasks could be generated.'
        );
      }

      if (emittedSubtasks !== subtasks.length) {
        throw new AppError(
          ErrorCode.AI_INVALID_RESPONSE_FORMAT,
          ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
          'Streamed subtasks do not match the completed AI response.'
        );
      }

      if (aiLogId) {
        await updateAiLog(
          aiLogId,
          getSuccessAiLogs(event.response.aiLogs, event.response.raw)
        );
      }

      yield { type: 'done' };
      return;
    }

    throw new AppError(
      ErrorCode.AI_INVALID_RESPONSE_FORMAT,
      ErrorHttpStatus[ErrorCode.AI_INVALID_RESPONSE_FORMAT],
      'AI stream ended without a completion event.'
    );
  } catch (error) {
    if (aiLogId) {
      const { status: _status, ...normalizedError } = normalizeAiError(error);
      await updateAiLog(aiLogId, getFailedAiLogs(normalizedError));
    }

    throw error;
  }
}
