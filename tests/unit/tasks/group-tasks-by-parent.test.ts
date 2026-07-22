import { createTask } from '@tests/factories/task.factory';
import { describe, expect, it } from 'vitest';

import { groupTasksByParent } from '@/features/tasks/utils/tasks.utils';

describe('groupTasksByParent', () => {
  it('returns an empty array when tasks is empty', () => {
    expect(groupTasksByParent([])).toEqual([]);
  });

  it('returns root tasks with empty subtasks', () => {
    const task1 = createTask({ id: '1', position: 'b' });
    const task2 = createTask({ id: '2', position: 'a', status: 'done' });

    expect(groupTasksByParent([task1, task2])).toEqual([
      { parent: task2, subtasks: [] },
      { parent: task1, subtasks: [] },
    ]);
  });

  it('groups a single child under its parent', () => {
    const parent = createTask({ id: '1' });
    const child = createTask({
      id: '2',
      parentTaskId: '1',
    });

    expect(groupTasksByParent([child, parent])).toEqual([
      {
        parent,
        subtasks: [child],
      },
    ]);
  });

  it('groups multiple children under the same parent', () => {
    const parent = createTask({ id: '1' });
    const child1 = createTask({
      id: '2',
      parentTaskId: '1',
    });
    const child2 = createTask({
      id: '3',
      parentTaskId: '1',
    });

    expect(groupTasksByParent([parent, child1, child2])).toEqual([
      {
        parent,
        subtasks: [child1, child2],
      },
    ]);
  });

  it('groups children under the correct parent', () => {
    const parent1 = createTask({ id: '1', position: 'b' });
    const parent2 = createTask({
      id: '2',
      position: 'a',
      status: 'done',
    });

    const child1 = createTask({
      id: '3',
      parentTaskId: '1',
    });

    const child2 = createTask({
      id: '4',
      parentTaskId: '2',
    });

    expect(groupTasksByParent([child2, parent1, child1, parent2])).toEqual([
      {
        parent: parent2,
        subtasks: [child2],
      },
      {
        parent: parent1,
        subtasks: [child1],
      },
    ]);
  });

  it('ignores orphan subtasks', () => {
    const orphan = createTask({
      parentTaskId: 'missing',
    });

    expect(groupTasksByParent([orphan])).toEqual([]);
  });

  it('sorts parent groups by position', () => {
    const c = createTask({ id: '1', position: 'c' });
    const a = createTask({ id: '2', position: 'a' });
    const b = createTask({ id: '3', position: 'b' });

    expect(groupTasksByParent([c, a, b]).map((g) => g.parent.id)).toEqual([
      '2',
      '3',
      '1',
    ]);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      createTask({ id: '2', position: 'b' }),
      createTask({ id: '1', position: 'a' }),
    ];

    const original = [...tasks];

    groupTasksByParent(tasks);

    expect(tasks).toEqual(original);
  });
});
