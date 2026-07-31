import { createTask } from '@tests/factories/task.factory';
import { describe, expect, it } from 'vitest';

import { TaskGroup } from '@/features/tasks/types/tasks.types';
import { filterGroupsByQuery } from '@/features/tasks/utils/tasks.utils';

function group(
  parentOverrides: Parameters<typeof createTask>[0],
  subtaskOverrides: Parameters<typeof createTask>[0][] = []
): TaskGroup {
  const parent = createTask(parentOverrides);
  return {
    parent,
    subtasks: subtaskOverrides.map((overrides) =>
      createTask({ parentTaskId: parent.id, ...overrides })
    ),
  };
}

describe('filterGroupsByQuery', () => {
  it('returns all groups unchanged when the query is empty', () => {
    const groups = [group({ title: 'Buy milk' }), group({ title: 'Walk dog' })];

    expect(filterGroupsByQuery(groups, '')).toEqual(groups);
  });

  it('returns all groups unchanged when the query is only whitespace', () => {
    const groups = [group({ title: 'Buy milk' })];

    expect(filterGroupsByQuery(groups, '   ')).toEqual(groups);
  });

  it('drops groups where neither the parent nor any subtask matches', () => {
    const groups = [
      group({ title: 'Buy milk' }),
      group({ title: 'Walk dog' }),
    ];

    const result = filterGroupsByQuery(groups, 'milk');

    expect(result.map((g) => g.parent.title)).toEqual(['Buy milk']);
  });

  it('matches case-insensitively', () => {
    const groups = [group({ title: 'Buy Milk' })];

    expect(filterGroupsByQuery(groups, 'MILK')).toHaveLength(1);
  });

  it('matches against the description as well as the title', () => {
    const groups = [
      group({ title: 'Errands', description: 'pick up dry cleaning' }),
      group({ title: 'Other', description: null }),
    ];

    const result = filterGroupsByQuery(groups, 'dry cleaning');

    expect(result.map((g) => g.parent.title)).toEqual(['Errands']);
  });

  it('keeps a parent visible when only a subtask matches, filtered to just that subtask', () => {
    const groups = [
      group({ id: 'p1', title: 'Groceries' }, [
        { id: 's1', title: 'Buy milk' },
        { id: 's2', title: 'Buy eggs' },
      ]),
    ];

    const result = filterGroupsByQuery(groups, 'milk');

    expect(result).toHaveLength(1);
    expect(result[0].parent.id).toBe('p1');
    expect(result[0].subtasks.map((t) => t.id)).toEqual(['s1']);
  });

  it('keeps every subtask when the parent itself matches, even if not all subtasks do', () => {
    const groups = [
      group({ id: 'p1', title: 'Milk run' }, [
        { id: 's1', title: 'Buy milk' },
        { id: 's2', title: 'Buy eggs' },
      ]),
    ];

    const result = filterGroupsByQuery(groups, 'milk');

    expect(result[0].subtasks.map((t) => t.id)).toEqual(['s1', 's2']);
  });

  it('drops a group entirely when neither the parent nor any subtask matches', () => {
    const groups = [
      group({ id: 'p1', title: 'Groceries' }, [
        { id: 's1', title: 'Buy eggs' },
      ]),
    ];

    expect(filterGroupsByQuery(groups, 'milk')).toEqual([]);
  });

  it('handles an empty groups array', () => {
    expect(filterGroupsByQuery([], 'milk')).toEqual([]);
  });

  it('does not mutate the original groups array', () => {
    const groups = [
      group({ id: 'p1', title: 'Groceries' }, [
        { id: 's1', title: 'Buy milk' },
        { id: 's2', title: 'Buy eggs' },
      ]),
    ];
    const snapshot = structuredClone(groups);

    filterGroupsByQuery(groups, 'milk');

    expect(groups).toEqual(snapshot);
  });
});
