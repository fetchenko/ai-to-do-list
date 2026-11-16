import { describe, expect, it } from 'vitest';

import { createSubtaskTool } from '@/infrastructure/ai/tools/create-subtask-tool';
import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiInvalidResponseFormat } from '@/shared/errors/ai-app-error';

describe('parseToolCall', () => {
  it('parses a create_subtask tool call', () => {
    expect(
      parseToolCall(
        {
          index: 0,
          id: 'call-1',
          name: 'create_subtask',
          arguments: JSON.stringify({
            title: 'Buy groceries',
            description: 'Go to the store',
          }),
        },
        [createSubtaskTool]
      )
    ).toEqual({
      type: 'event',
      data: {
        title: 'Buy groceries',
        description: 'Go to the store',
      },
    });
  });

  it('allows an omitted description', () => {
    expect(
      parseToolCall(
        {
          index: 0,
          id: 'call-1',
          name: 'create_subtask',
          arguments: JSON.stringify({
            title: 'Buy groceries',
          }),
        },
        [createSubtaskTool]
      )
    ).toEqual({
      type: 'event',
      data: {
        title: 'Buy groceries',
      },
    });
  });

  it('rejects an unexpected tool', () => {
    expect(() =>
      parseToolCall(
        {
          index: 0,
          id: 'call-1',
          name: 'delete_task',
          arguments: '{}',
        },
        [createSubtaskTool]
      )
    ).toThrow(new AiInvalidResponseFormat('Unexpected AI tool: delete_task'));
  });

  it('rejects malformed JSON arguments', () => {
    expect(() =>
      parseToolCall(
        {
          index: 0,
          id: 'call-1',
          name: 'create_subtask',
          arguments: '{"title":"Buy groceries"',
        },
        [createSubtaskTool]
      )
    ).toThrow(
      new AiInvalidResponseFormat('AI returned invalid tool arguments')
    );
  });

  it('does not validate tool arguments against a domain schema', () => {
    expect(
      parseToolCall(
        {
          index: 0,
          id: 'call-1',
          name: 'create_subtask',
          arguments: JSON.stringify({ description: 'Missing title' }),
        },
        [createSubtaskTool]
      )
    ).toEqual({
      type: 'event',
      data: {
        description: 'Missing title',
      },
    });
  });
});
