import { describe, expect, it } from 'vitest';

import { moveAndFindNeighbors } from '@/features/tasks/utils/dnd/move-and-find-neighbors';

type Item = {
  id: string;
  position: string;
};

function makeItem(id: string, position: string): Item {
  return { id, position };
}

describe('moveAndFindNeighbors', () => {
  describe('guard clauses', () => {
    it('returns undefined when active id is not found', () => {
      const items = [makeItem('a', 'a0'), makeItem('b', 'a1')];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'missing',
          overId: 'b',
        })
      ).toBeUndefined();
    });

    it('returns undefined when over id is not found', () => {
      const items = [makeItem('a', 'a0'), makeItem('b', 'a1')];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'a',
          overId: 'missing',
        })
      ).toBeUndefined();
    });

    it('returns undefined when both ids are missing', () => {
      expect(
        moveAndFindNeighbors({
          items: [],
          activeId: 'a',
          overId: 'b',
        })
      ).toBeUndefined();
    });
  });

  describe('reordering', () => {
    it('returns previous and next positions when moved into the middle', () => {
      const items = [
        makeItem('a', 'a0'),
        makeItem('b', 'a1'),
        makeItem('c', 'a2'),
      ];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'c',
          overId: 'b',
        })
      ).toEqual({
        reordered: [
          makeItem('a', 'a0'),
          makeItem('c', 'a2'),
          makeItem('b', 'a1'),
        ],
        neighbors: {
          prev: 'a0',
          next: 'a1',
        },
      });
    });

    it('returns null previous position when moved to the beginning', () => {
      const items = [
        makeItem('a', 'a1'),
        makeItem('b', 'a2'),
        makeItem('c', 'a3'),
      ];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'c',
          overId: 'a',
        })
      ).toEqual({
        reordered: [
          makeItem('c', 'a3'),
          makeItem('a', 'a1'),
          makeItem('b', 'a2'),
        ],
        neighbors: {
          prev: null,
          next: 'a1',
        },
      });
    });

    it('returns null next position when moved to the end', () => {
      const items = [
        makeItem('a', 'a1'),
        makeItem('b', 'a2'),
        makeItem('c', 'a3'),
      ];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'a',
          overId: 'c',
        })
      ).toEqual({
        reordered: [
          makeItem('b', 'a2'),
          makeItem('c', 'a3'),
          makeItem('a', 'a1'),
        ],
        neighbors: {
          prev: 'a3',
          next: null,
        },
      });
    });

    it('handles swapping two adjacent items', () => {
      const items = [makeItem('a', 'a0'), makeItem('b', 'a1')];

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'a',
          overId: 'b',
        })
      ).toEqual({
        reordered: [makeItem('b', 'a1'), makeItem('a', 'a0')],
        neighbors: {
          prev: 'a1',
          next: null,
        },
      });
    });
  });

  describe('immutability', () => {
    it('does not mutate the original array', () => {
      const items = [makeItem('a', 'a0'), makeItem('b', 'a1')];

      const snapshot = [...items];

      moveAndFindNeighbors({
        items,
        activeId: 'a',
        overId: 'b',
      });

      expect(items).toEqual(snapshot);
    });

    it('does not mutate item objects', () => {
      const a = makeItem('a', 'a0');
      const b = makeItem('b', 'a1');

      moveAndFindNeighbors({
        items: [a, b],
        activeId: 'a',
        overId: 'b',
      });

      expect(a.position).toBe('a0');
      expect(b.position).toBe('a1');
    });
  });

  describe('edge cases', () => {
    it('works with a large list', () => {
      const items = Array.from({ length: 50 }, (_, i) =>
        makeItem(`id-${i}`, String(i).padStart(2, '0'))
      );

      expect(
        moveAndFindNeighbors({
          items,
          activeId: 'id-49',
          overId: 'id-10',
        })?.neighbors
      ).toEqual({
        prev: '09',
        next: '10',
      });
    });
  });
});
