import { beforeEach, describe, expect, it, vi } from 'vitest';

import { findInsertionNeighbors } from '@/features/tasks/utils/dnd/find-insertion-neighbors';
import { neighborsAtIndex } from '@/features/tasks/utils/dnd/neighbors-at-index';

vi.mock('@/features/tasks/utils/dnd/neighbors-at-index');

const mockedNeighborsAtIndex = vi.mocked(neighborsAtIndex);

describe('findInsertionNeighbors', () => {
  const items = [
    {
      id: 'task-1',
      position: 'a',
    },
    {
      id: 'task-2',
      position: 'b',
    },
    {
      id: 'task-3',
      position: 'c',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockedNeighborsAtIndex.mockReturnValue('neighbors' as any);
  });

  it('removes active item before finding neighbors', () => {
    findInsertionNeighbors({
      items,
      activeId: 'task-2',
      overId: 'task-3',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(
      [
        {
          id: 'task-1',
          position: 'a',
        },
        {
          id: 'task-3',
          position: 'c',
        },
      ],
      1
    );
  });

  it('inserts before the over item', () => {
    findInsertionNeighbors({
      items,
      activeId: 'task-1',
      overId: 'task-3',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(
      [
        {
          id: 'task-2',
          position: 'b',
        },
        {
          id: 'task-3',
          position: 'c',
        },
      ],
      1
    );
  });

  it('inserts at the beginning when overId is first item', () => {
    findInsertionNeighbors({
      items,
      activeId: 'task-3',
      overId: 'task-1',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(
      [
        {
          id: 'task-1',
          position: 'a',
        },
        {
          id: 'task-2',
          position: 'b',
        },
      ],
      0
    );
  });

  it('inserts at the end when overId does not exist', () => {
    findInsertionNeighbors({
      items,
      activeId: 'task-1',
      overId: 'missing-task',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(
      [
        {
          id: 'task-2',
          position: 'b',
        },
        {
          id: 'task-3',
          position: 'c',
        },
      ],
      2
    );
  });

  it('uses array length as index when overId is missing', () => {
    findInsertionNeighbors({
      items: [
        {
          id: 'task-1',
          position: 'a',
        },
      ],
      activeId: 'task-1',
      overId: 'missing',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith([], 0);
  });

  it('works when activeId does not exist', () => {
    findInsertionNeighbors({
      items,
      activeId: 'missing-active',
      overId: 'task-2',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(items, 1);
  });

  it('works with empty items array', () => {
    findInsertionNeighbors({
      items: [],
      activeId: 'task-1',
      overId: 'task-2',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith([], 0);
  });

  it('handles moving only item in the list', () => {
    findInsertionNeighbors({
      items: [
        {
          id: 'task-1',
          position: 'a',
        },
      ],
      activeId: 'task-1',
      overId: 'task-1',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith([], 0);
  });

  it('returns whatever neighborsAtIndex returns', () => {
    mockedNeighborsAtIndex.mockReturnValue({
      previous: {
        id: 'task-1',
      },
      next: {
        id: 'task-2',
      },
    } as any);

    const result = findInsertionNeighbors({
      items,
      activeId: 'task-1',
      overId: 'task-2',
    });

    expect(result).toEqual({
      previous: {
        id: 'task-1',
      },
      next: {
        id: 'task-2',
      },
    });
  });

  it('does not mutate original items array', () => {
    const original = [...items];

    findInsertionNeighbors({
      items,
      activeId: 'task-1',
      overId: 'task-3',
    });

    expect(items).toEqual(original);
  });

  it('handles duplicate ids by removing all matching active ids', () => {
    const duplicatedItems = [
      {
        id: 'task-1',
        position: 'a',
      },
      {
        id: 'task-1',
        position: 'b',
      },
      {
        id: 'task-2',
        position: 'c',
      },
    ];

    findInsertionNeighbors({
      items: duplicatedItems,
      activeId: 'task-1',
      overId: 'task-2',
    });

    expect(mockedNeighborsAtIndex).toHaveBeenCalledWith(
      [
        {
          id: 'task-2',
          position: 'c',
        },
      ],
      0
    );
  });
});
