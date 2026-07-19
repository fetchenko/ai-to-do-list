import { beforeEach, describe, expect, it, vi } from 'vitest';

import { calculateSubtaskMove } from '@/features/tasks/utils/dnd/calculate-subtask-move';
import { findInsertionNeighbors } from '@/features/tasks/utils/dnd/find-insertion-neighbors';
import { generatePosition } from '@/features/tasks/utils/dnd/generate-position';
import { getTargetParentId } from '@/features/tasks/utils/dnd/get-target-parent-id';

vi.mock('@/features/tasks/utils/dnd/find-insertion-neighbors');
vi.mock('@/features/tasks/utils/dnd/generate-position');
vi.mock('@/features/tasks/utils/dnd/get-target-parent-id');

const mockedFindInsertionNeighbors = vi.mocked(findInsertionNeighbors);
const mockedGeneratePosition = vi.mocked(generatePosition);
const mockedGetTargetParentId = vi.mocked(getTargetParentId);

describe('calculateSubtaskMove', () => {
  const groups = [
    {
      parent: {
        id: 'parent-1',
      },
      subtasks: [{ id: 'task-1' }, { id: 'task-2' }],
    },
    {
      parent: {
        id: 'parent-2',
      },
      subtasks: [{ id: 'task-3' }],
    },
  ] as any;

  const createEvent = ({
    over = true,
    activeParentId = 'parent-1',
    activeId = 'task-1',
    overId = 'task-2',
    overData = {},
  }: {
    over?: boolean;
    activeParentId?: string | null;
    activeId?: string | number;
    overId?: string | number;
    overData?: any;
  } = {}) =>
    ({
      active: {
        id: activeId,
        data: {
          current: {
            parentTaskId: activeParentId,
          },
        },
      },
      over: over
        ? {
            id: overId,
            data: {
              current: overData,
            },
          }
        : null,
    }) as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when there is no over item', () => {
    const result = calculateSubtaskMove(groups, createEvent({ over: false }));

    expect(result).toBeUndefined();

    expect(mockedGetTargetParentId).not.toHaveBeenCalled();

    expect(mockedFindInsertionNeighbors).not.toHaveBeenCalled();

    expect(mockedGeneratePosition).not.toHaveBeenCalled();
  });

  it('returns undefined when target parent id is missing', () => {
    mockedGetTargetParentId.mockReturnValue(null);

    const result = calculateSubtaskMove(groups, createEvent());

    expect(result).toBeUndefined();

    expect(mockedGetTargetParentId).toHaveBeenCalled();

    expect(mockedFindInsertionNeighbors).not.toHaveBeenCalled();
  });

  it('returns undefined when target group does not exist', () => {
    mockedGetTargetParentId.mockReturnValue('unknown-parent');

    const result = calculateSubtaskMove(groups, createEvent());

    expect(result).toBeUndefined();

    expect(mockedFindInsertionNeighbors).not.toHaveBeenCalled();

    expect(mockedGeneratePosition).not.toHaveBeenCalled();
  });

  it('calculates move inside the same parent', () => {
    mockedGetTargetParentId.mockReturnValue('parent-1');

    mockedFindInsertionNeighbors.mockReturnValue({
      previous: null,
      next: {
        id: 'task-2',
      },
    } as any);

    mockedGeneratePosition.mockReturnValue('position-1');

    const result = calculateSubtaskMove(
      groups,
      createEvent({
        activeParentId: 'parent-1',
      })
    );

    expect(result).toEqual({
      position: 'position-1',
      parentTaskId: 'parent-1',
      changedParent: false,
    });
  });

  it('calculates move to another parent', () => {
    mockedGetTargetParentId.mockReturnValue('parent-2');

    mockedFindInsertionNeighbors.mockReturnValue({
      previous: null,
      next: null,
    } as any);

    mockedGeneratePosition.mockReturnValue('position-2');

    const result = calculateSubtaskMove(
      groups,
      createEvent({
        activeParentId: 'parent-1',
        overId: 'task-3',
      })
    );

    expect(result).toEqual({
      position: 'position-2',
      parentTaskId: 'parent-2',
      changedParent: true,
    });
  });

  it('uses the correct target group subtasks', () => {
    mockedGetTargetParentId.mockReturnValue('parent-2');

    mockedFindInsertionNeighbors.mockReturnValue({} as any);

    mockedGeneratePosition.mockReturnValue('position');

    calculateSubtaskMove(
      groups,
      createEvent({
        overId: 'task-3',
      })
    );

    expect(mockedFindInsertionNeighbors).toHaveBeenCalledWith({
      items: groups[1].subtasks,
      activeId: 'task-1',
      overId: 'task-3',
    });
  });

  it('passes neighbors to generatePosition', () => {
    mockedGetTargetParentId.mockReturnValue('parent-1');

    const neighbors = {
      previous: {
        id: 'task-1',
      },
      next: {
        id: 'task-2',
      },
    };

    mockedFindInsertionNeighbors.mockReturnValue(neighbors as any);

    mockedGeneratePosition.mockReturnValue('new-position');

    calculateSubtaskMove(groups, createEvent());

    expect(mockedGeneratePosition).toHaveBeenCalledWith(neighbors);
  });

  it('marks changedParent true when moving from null parent', () => {
    mockedGetTargetParentId.mockReturnValue('parent-1');

    mockedFindInsertionNeighbors.mockReturnValue({} as any);

    mockedGeneratePosition.mockReturnValue('position');

    const result = calculateSubtaskMove(
      groups,
      createEvent({
        activeParentId: null,
      })
    );

    expect(result?.changedParent).toBe(true);
  });

  it('converts ids to strings before finding neighbors', () => {
    mockedGetTargetParentId.mockReturnValue('parent-1');

    mockedFindInsertionNeighbors.mockReturnValue({} as any);

    mockedGeneratePosition.mockReturnValue('position');

    calculateSubtaskMove(
      groups,
      createEvent({
        activeId: 123,
        overId: 456,
      })
    );

    expect(mockedFindInsertionNeighbors).toHaveBeenCalledWith({
      items: groups[0].subtasks,
      activeId: '123',
      overId: '456',
    });
  });
});
