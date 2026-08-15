import { describe, expect, it } from 'vitest';

import { SubtaskStreamParser } from '@/infrastructure/ai/utils/subtask-stream.parser';

describe('SubtaskStreamParser', () => {
  it('emits completed subtasks as JSON chunks arrive', () => {
    const parser = new SubtaskStreamParser();

    expect(
      parser.push('{"subtasks":[{"title":"Create database schema","descr')
    ).toEqual([]);

    expect(
      parser.push('iption":"Design tables"},{"title":"Build API"}]}')
    ).toEqual([
      {
        title: 'Create database schema',
        description: 'Design tables',
      },
      {
        title: 'Build API',
      },
    ]);
  });

  it('handles braces inside JSON strings', () => {
    const parser = new SubtaskStreamParser();

    expect(
      parser.push(
        '{"subtasks":[{"title":"Create {users} table","description":"Use {id} as the primary key"}]}'
      )
    ).toEqual([
      {
        title: 'Create {users} table',
        description: 'Use {id} as the primary key',
      },
    ]);
  });
});
