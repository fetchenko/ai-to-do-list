import {
  AiTool,
  PendingToolCall,
} from '@/infrastructure/ai/tools/tool-call.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

export function parseToolCall(
  toolCall: PendingToolCall,
  tools: AiTool[]
): AiStreamEvent {
  const tool = tools.find(
    ({ function: definition }) => definition.name === toolCall.name
  );

  if (!tool) {
    throw new AiInvalidResponseFormat(`Unexpected AI tool: ${toolCall.name}`);
  }

  let argumentsObject: unknown;

  try {
    argumentsObject = JSON.parse(toolCall.arguments);
  } catch {
    throw new AiInvalidResponseFormat('AI returned invalid tool arguments');
  }

  return {
    type: 'event',
    data: argumentsObject,
  };
}
