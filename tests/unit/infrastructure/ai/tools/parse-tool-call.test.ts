import { describe, expect, it } from 'vitest';

import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiTool } from '@/shared/types/ai-generation.types';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

const tool: AiTool = {
  name: 'generate_item',
  description: 'Generate an item',
  parameters: {},
};

describe('parseToolCall', () => {
  it('parses a generic generation tool call', () => {
    expect(
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'generate_item',
        arguments: JSON.stringify({
          data: 'Buy groceries',
          description: 'Go to the store',
        }),
      }, tool)
    ).toEqual({
      type: 'event',
      data: {
        data: 'Buy groceries',
        description: 'Go to the store',
      },
    });
  });

  it('rejects an unexpected tool', () => {
    expect(() =>
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'delete_task',
        arguments: '{}',
      }, tool)
    ).toThrow(new AiInvalidResponseFormat('Unexpected AI tool: delete_task'));
  });

  it('rejects malformed JSON arguments', () => {
    expect(() =>
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'generate_item',
        arguments: '{"data":"missing quote',
      }, tool)
    ).toThrow(new AiInvalidResponseFormat('AI returned invalid tool arguments'));
  });

  it('rejects arguments that do not match the generic generation item contract', () => {
    expect(() =>
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'generate_item',
        arguments: JSON.stringify({ description: 'Missing data' }),
      }, tool)
    ).toThrow(new AiInvalidResponseFormat('AI returned an invalid generation item'));
  });
});
