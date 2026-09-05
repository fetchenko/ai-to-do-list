import { describe, expect, it } from 'vitest';

import { parseToolCall } from '@/infrastructure/ai/tools/parse-tool-call';
import { AiInvalidResponseFormat } from '@/shared/errors/app-error';

describe('parseToolCall', () => {
  it('parses a create_subtask tool call', () => {
    expect(
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'create_subtask',
        arguments: JSON.stringify({
          title: 'Buy groceries',
          description: 'Go to the store',
        }),
      })
    ).toEqual({
      type: 'subtask',
      subtask: {
        title: 'Buy groceries',
        description: 'Go to the store',
      },
    });
  });

  it('allows an omitted description', () => {
    expect(
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'create_subtask',
        arguments: JSON.stringify({
          title: 'Buy groceries',
        }),
      })
    ).toEqual({
      type: 'subtask',
      subtask: {
        title: 'Buy groceries',
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
      })
    ).toThrow(new AiInvalidResponseFormat('Unexpected AI tool: delete_task'));
  });

  it('rejects malformed JSON arguments', () => {
    expect(() =>
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'create_subtask',
        arguments: '{"title":"Buy groceries"',
      })
    ).toThrow(
      new AiInvalidResponseFormat('AI returned invalid tool arguments')
    );
  });

  it('rejects invalid subtask arguments', () => {
    expect(() =>
      parseToolCall({
        index: 0,
        id: 'call-1',
        name: 'create_subtask',
        arguments: JSON.stringify({ description: 'Missing title' }),
      })
    ).toThrow(new AiInvalidResponseFormat('AI returned an invalid subtask'));
  });
});
