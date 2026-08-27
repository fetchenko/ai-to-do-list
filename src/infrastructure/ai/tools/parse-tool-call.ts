import { PendingToolCall } from '@/infrastructure/ai/tools/tool-call.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';
import { subtaskResponseSchema } from '@/shared/schema/subtasks.schema';

export function parseToolCall(toolCall: PendingToolCall): AiStreamEvent {
  if (toolCall.name !== 'create_subtask') {
    throw new AiInvalidResponseFormat(`Unexpected AI tool: ${toolCall.name}`);
  }

  let argumentsObject: unknown;

  try {
    argumentsObject = JSON.parse(toolCall.arguments);
  } catch {
    throw new AiInvalidResponseFormat('AI returned invalid tool arguments');
  }

  const result = subtaskResponseSchema.safeParse(argumentsObject);

  if (!result.success) {
    throw new AiInvalidResponseFormat('AI returned an invalid subtask');
  }

  return {
    type: 'subtask',
    subtask: result.data,
  };
}
