import { PendingToolCall } from '@/infrastructure/ai/providers/deepseek/stream/deepseek-stream.types';
import { AiStreamChunk } from '@/infrastructure/ai/types/ai-stream.types';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';
import { subtaskResponseSchema } from '@/shared/schema/subtasks.schema';

export function parseToolCall(toolCall: PendingToolCall): AiStreamChunk {
  if (toolCall.name !== 'create_subtask') {
    throw new AiInvalidResponseFormat(
      `Unexpected DeepSeek tool: ${toolCall.name}`
    );
  }

  let argumentsObject: unknown;

  try {
    argumentsObject = JSON.parse(toolCall.arguments);
  } catch {
    throw new AiInvalidResponseFormat(
      'DeepSeek returned invalid tool arguments'
    );
  }

  const result = subtaskResponseSchema.safeParse(argumentsObject);

  if (!result.success) {
    throw new AiInvalidResponseFormat('DeepSeek returned an invalid subtask');
  }

  return {
    type: 'subtask',
    subtask: result.data,
  };
}
