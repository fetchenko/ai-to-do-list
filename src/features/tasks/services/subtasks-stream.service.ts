import { streamSubtasksForTask as streamAiSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import type { SubtaskStreamEvent } from '@/features/tasks/types/stream-event.types';
import type { TaskPreview } from '@/features/tasks/types/database.types';

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
}): AsyncGenerator<SubtaskStreamEvent> {
  try {
    for await (const event of streamAiSubtasksForTask({
      task,
      userId,
      provider,
      signal,
    })) {
      if (event.type === 'tool_call') {
        const parsed = parseSubtaskToolCall(event.toolCall);

        yield {
          type: 'subtask',
          subtask: parsed,
        };
        continue;
      }

      yield {
        type: 'done',
      };
    }
  } catch (error) {
    if (signal.aborted) return;

    yield {
      type: 'error',
      error: normalizeAiError(error),
    };
  }
}

function parseSubtaskToolCall(toolCall: Parameters<typeof import('@/infrastructure/ai/tools/parse-tool-call').parseToolCall>[0]) {
  return import('@/infrastructure/ai/tools/parse-tool-call').then;
}
