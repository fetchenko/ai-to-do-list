import { AiToolCall } from '@/infrastructure/ai/types/ai-tool.types';
import { AiStreamEvent } from '@/infrastructure/ai/types/ai-stream.types';
import { AiTool } from '@/shared/types/ai-generation.types';
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

  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data) ||
    typeof (data as Record<string, unknown>).data !== 'string' ||
    typeof (data as Record<string, unknown>).description !== 'string'
  ) {
    throw new AiInvalidResponseFormat('AI returned an invalid generation item');
  }

  return {
    type: 'event',
    data: {
      data: (data as Record<string, string>).data,
      description: (data as Record<string, string>).description,
    },
  };
}
