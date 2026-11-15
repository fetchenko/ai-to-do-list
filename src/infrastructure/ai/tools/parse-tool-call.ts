import { AiTool } from '@/infrastructure/ai/types/ai-tool.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiToolCall } from '@/infrastructure/ai/types/ai-tool.types';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

export function parseToolCall(
  toolCall: AiToolCall,
  tool: AiTool
): AiStreamEvent {
  if (toolCall.name !== tool.name) {
    throw new AiInvalidResponseFormat(`Unexpected AI tool: ${toolCall.name}`);
  }

  let data: unknown;

  try {
    data = JSON.parse(toolCall.arguments);
  } catch {
    throw new AiInvalidResponseFormat('AI returned invalid tool arguments');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new AiInvalidResponseFormat('AI returned invalid tool arguments');
  }

  return {
    type: 'event',
    data: data as Record<string, unknown>,
  };
}
