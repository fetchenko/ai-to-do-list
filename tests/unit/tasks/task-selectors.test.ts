import { describe, expect, it } from 'vitest';

import { buildGroups } from '@/features/tasks/utils/tasks.utils';

describe('buildGroups', () => {
  it('groups tasks by parentTaskId', () => {
    const tasks = [
      { id: 'p1', parentTaskId: null },
      { id: 'c1', parentTaskId: 'p1' },
      { id: 'c2', parentTaskId: 'p1' },
    ];

    const result = buildGroups(tasks as any);

    expect(result).toHaveLength(1);

    expect(result[0].parent.id).toBe('p1');
    expect(result[0].subtasks.map((t) => t.id)).toEqual(['c1', 'c2']);
  });

  it('returns empty array when there are no root tasks', () => {
    const tasks = [
      { id: 'c1', parentTaskId: 'p1' },
      { id: 'c2', parentTaskId: 'p2' },
    ];

    const result = buildGroups(tasks as any);

    expect(result).toEqual([]);
  });

  it('handles tasks with no children', () => {
    const tasks = [
      { id: 'p1', parentTaskId: null },
      { id: 'p2', parentTaskId: null },
    ];

    const result = buildGroups(tasks as any);

    expect(result).toHaveLength(2);

    expect(result.find((g) => g.parent.id === 'p1')?.subtasks).toEqual([]);
    expect(result.find((g) => g.parent.id === 'p2')?.subtasks).toEqual([]);
  });

  it('handles empty input', () => {
    expect(buildGroups([])).toEqual([]);
  });

  it('ignores subtasks whose parent is not in input list', () => {
    const tasks = [{ id: 'c1', parentTaskId: 'missing-parent' }];

    const result = buildGroups(tasks as any);

    expect(result).toEqual([]);
  });

  it('groups multiple parents correctly', () => {
    const tasks = [
      { id: 'p1', parentTaskId: null },
      { id: 'p2', parentTaskId: null },
      { id: 'c1', parentTaskId: 'p1' },
      { id: 'c2', parentTaskId: 'p2' },
    ];

    const result = buildGroups(tasks as any);

    expect(result).toHaveLength(2);

    const group1 = result.find((g) => g.parent.id === 'p1');
    const group2 = result.find((g) => g.parent.id === 'p2');

    expect(group1?.subtasks.map((t) => t.id)).toEqual(['c1']);
    expect(group2?.subtasks.map((t) => t.id)).toEqual(['c2']);
  });

  it('does not mutate original tasks array', () => {
    const tasks = [
      { id: 'p1', parentTaskId: null },
      { id: 'c1', parentTaskId: 'p1' },
    ];

    const snapshot = structuredClone(tasks);

    buildGroups(tasks as any);

    expect(tasks).toEqual(snapshot);
  });
});
