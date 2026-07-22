import { createTask } from '@tests/factories/task.factory';
import { describe, expect, it } from 'vitest';

import {
  groupTasksByParent,
  groupTasksByStatus,
} from '@/features/tasks/utils/tasks.utils';

describe('groupTasksByStatus', () => {
  it('returns empty buckets when tasks is empty', () => {
    expect(groupTasksByStatus([])).toEqual({
      active: [],
      done: [],
      archived: [],
    });
  });

  it('groups task groups by parent status', () => {
    const active = createTask({
      id: '1',
      status: 'active',
      position: 'a',
    });

    const done = createTask({
      id: '2',
      status: 'done',
      position: 'b',
    });

    const archived = createTask({
      id: '3',
      status: 'archived',
      position: 'c',
    });

    const result = groupTasksByStatus([archived, done, active]);

    expect(result.active).toEqual([{ parent: active, subtasks: [] }]);

    expect(result.done).toEqual([{ parent: done, subtasks: [] }]);

    expect(result.archived).toEqual([{ parent: archived, subtasks: [] }]);
  });

  it('uses the parent status even when children have different statuses', () => {
    const parent = createTask({
      id: '1',
      status: 'active',
    });

    const doneChild = createTask({
      id: '2',
      parentTaskId: '1',
      status: 'done',
    });

    const archivedChild = createTask({
      id: '3',
      parentTaskId: '1',
      status: 'archived',
    });

    const result = groupTasksByStatus([parent, doneChild, archivedChild]);

    expect(result).toEqual({
      active: [
        {
          parent,
          subtasks: [doneChild, archivedChild],
        },
      ],
      done: [],
      archived: [],
    });
  });

  it('preserves parent ordering within each status', () => {
    const third = createTask({
      id: '3',
      position: 'c',
    });

    const first = createTask({
      id: '1',
      position: 'a',
    });

    const second = createTask({
      id: '2',
      position: 'b',
    });

    const result = groupTasksByStatus([third, first, second]);

    expect(result.active.map((g) => g.parent.id)).toEqual(['1', '2', '3']);
  });

  it('does not mutate the input array', () => {
    const tasks = [
      createTask({ id: '2', position: 'b' }),
      createTask({ id: '1', position: 'a' }),
    ];

    const original = [...tasks];

    groupTasksByStatus(tasks);

    expect(tasks).toEqual(original);
  });

  it('sorts parent groups using updated task positions', () => {
    const tasks = [
      createTask({ id: '1', position: 'a' }),
      createTask({ id: '2', position: 'b' }),
      createTask({ id: '3', position: 'c' }),
    ];

    const updatedTasks = [
      { ...tasks[0], position: 'd' },
      tasks[1],
      { ...tasks[2], position: 'Z' },
    ];

    expect(groupTasksByParent(updatedTasks).map((g) => g.parent.id)).toEqual([
      '3',
      '2',
      '1',
    ]);
  });
});
