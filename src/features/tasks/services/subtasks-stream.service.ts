import type { TaskPreview } from '@/features/tasks/types/database.types';
import type { SubtaskStreamEvent } from '@/features/tasks/types/stream-event.types';
import { streamSubtasksForTask as streamAiSubtasksForTask } from '@/infrastructure/ai/services/subtasks.service';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import type { AIProvider } from '@/infrastructure/ai/providers/ai-provider';

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
  for await (const event of streamAiSubtasksForTask({
    task,
    userId,
    provider,
    signal,
  })) {
    if (event.type === 'tool_call') {
      yield {
        type: 'subtask',
        subtask: parseToolCall(event.toolCall),
      };
      continue;
    }

    if (event.type === 'error') {
      yield event;
      continue;
    }

    yield { type: 'done' };
  }
}
