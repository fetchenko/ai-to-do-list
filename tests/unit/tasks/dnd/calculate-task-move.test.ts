import { DragEndEvent } from '@dnd-kit/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskGroup } from '@/features/tasks/types/tasks.types';
import { calculateTaskMove } from '@/features/tasks/utils/dnd/calculate-task-move';
import { generatePosition } from '@/features/tasks/utils/dnd/generate-position';
import { moveAndFindNeighbors } from '@/features/tasks/utils/dnd/move-and-find-neighbors';
import { byTaskPosition } from '@/features/tasks/utils/tasks.utils';

vi.mock('@/features/tasks/utils/dnd/move-and-find-neighbors');
vi.mock('@/features/tasks/utils/dnd/generate-position');
vi.mock('@/features/tasks/utils/tasks.utils');

const mockedMoveAndFindNeighbors = vi.mocked(moveAndFindNeighbors);
const mockedGeneratePosition = vi.mocked(generatePosition);
const mockedByTaskPosition = vi.mocked(byTaskPosition);

describe('calculateTaskMove', () => {
  const groups = [
    {
      parent: {
        id: 'task-2',
        position: 2,
      },
      subtasks: [],
    },
    {
      parent: {
        id: 'task-1',
        position: 1,
      },
      subtasks: [],
    },
  ] as unknown as TaskGroup[];

  const createEvent = ({
    over = true,
    activeId = 'task-1',
    overId = 'task-2',
  }: {
    over?: boolean;
    activeId?: string | number;
    overId?: string | number;
  } = {}) =>
    ({
      active: {
        id: activeId,
      },
      over: over
        ? {
            id: overId,
          }
        : null,
    }) as DragEndEvent;

  beforeEach(() => {
    vi.clearAllMocks();

    mockedByTaskPosition.mockImplementation((a, b) =>
      a.position < b.position ? -1 : a.position > b.position ? 1 : 0
    );
  });

  describe('when there is no over element', () => {
    it('returns undefined', () => {
      const result = calculateTaskMove(
        groups,
        createEvent({
          over: false,
        })
      );

      expect(result).toBeUndefined();

      expect(mockedMoveAndFindNeighbors).not.toHaveBeenCalled();

      expect(mockedGeneratePosition).not.toHaveBeenCalled();
    });
  });

  describe('when moving a task', () => {
    it('sorts groups by task position', () => {
      mockedMoveAndFindNeighbors.mockReturnValue({
        neighbors: {},
      } as any);

      mockedGeneratePosition.mockReturnValue('new-position');

      calculateTaskMove(groups, createEvent());

      expect(mockedByTaskPosition).toHaveBeenCalledWith(
        groups[1].parent,
        groups[0].parent
      );
    });
  });

  it('passes sorted tasks to moveAndFindNeighbors', () => {
    mockedMoveAndFindNeighbors.mockReturnValue({
      neighbors: {},
    } as any);

    mockedGeneratePosition.mockReturnValue('position');

    calculateTaskMove(groups, createEvent());

    expect(mockedMoveAndFindNeighbors).toHaveBeenCalledWith({
      items: [
        {
          id: 'task-1',
          position: 1,
        },
        {
          id: 'task-2',
          position: 2,
        },
      ],
      activeId: 'task-1',
      overId: 'task-2',
    });
  });

  it('converts ids to strings', () => {
    mockedMoveAndFindNeighbors.mockReturnValue({
      neighbors: {},
    } as any);

    mockedGeneratePosition.mockReturnValue('position');

    calculateTaskMove(
      groups,
      createEvent({
        activeId: 123,
        overId: 456,
      })
    );

    expect(mockedMoveAndFindNeighbors).toHaveBeenCalledWith(
      expect.objectContaining({
        activeId: '123',
        overId: '456',
      })
    );
  });

  describe('when moveAndFindNeighbors returns undefined', () => {
    it('returns undefined', () => {
      mockedMoveAndFindNeighbors.mockReturnValue(undefined);

      const result = calculateTaskMove(groups, createEvent());

      expect(result).toBeUndefined();

      expect(mockedGeneratePosition).not.toHaveBeenCalled();
    });
  });

  describe('when neighbors are found', () => {
    it('generates position and returns it', () => {
      const neighbors = {
        previous: {
          id: 'task-1',
        },
        next: {
          id: 'task-2',
        },
      };

      mockedMoveAndFindNeighbors.mockReturnValue({
        neighbors,
      } as any);

      mockedGeneratePosition.mockReturnValue('generated-position');

      const result = calculateTaskMove(groups, createEvent());

      expect(mockedGeneratePosition).toHaveBeenCalledWith(neighbors);

      expect(result).toEqual({
        position: 'generated-position',
      });
    });
  });

  it('works with empty groups', () => {
    mockedMoveAndFindNeighbors.mockReturnValue({
      neighbors: {},
    } as any);

    mockedGeneratePosition.mockReturnValue('position');

    const result = calculateTaskMove([], createEvent());

    expect(mockedMoveAndFindNeighbors).toHaveBeenCalledWith({
      items: [],
      activeId: 'task-1',
      overId: 'task-2',
    });

    expect(result).toEqual({
      position: 'position',
    });
  });

  it('does not mutate original groups array', () => {
    mockedMoveAndFindNeighbors.mockReturnValue({
      neighbors: {},
    } as any);

    mockedGeneratePosition.mockReturnValue('position');

    const original = [...groups];

    calculateTaskMove(groups, createEvent());

    expect(groups).toEqual(original);
  });
});
