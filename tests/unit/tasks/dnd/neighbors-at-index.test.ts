import { describe, expect, it } from 'vitest';

import { neighborsAtIndex } from '@/features/tasks/utils/dnd/neighbors-at-index';

describe('neighborsAtIndex', () => {
  const items = [
    {
      position: 'a',
    },
    {
      position: 'b',
    },
    {
      position: 'c',
    },
  ];

  it('returns null previous and first item as next when inserting at beginning', () => {
    const result = neighborsAtIndex(items, 0);

    expect(result).toEqual({
      prev: null,
      next: 'a',
    });
  });

  it('returns previous and next positions when inserting in the middle', () => {
    const result = neighborsAtIndex(items, 2);

    expect(result).toEqual({
      prev: 'b',
      next: 'c',
    });
  });

  it('returns previous position and null next when inserting at the end', () => {
    const result = neighborsAtIndex(items, items.length);

    expect(result).toEqual({
      prev: 'c',
      next: null,
    });
  });

  it('returns nulls for an empty array', () => {
    const result = neighborsAtIndex([], 0);

    expect(result).toEqual({
      prev: null,
      next: null,
    });
  });

  it('handles a single item inserting before it', () => {
    const result = neighborsAtIndex(
      [
        {
          position: 'a',
        },
      ],
      0
    );

    expect(result).toEqual({
      prev: null,
      next: 'a',
    });
  });

  it('handles a single item inserting after it', () => {
    const result = neighborsAtIndex(
      [
        {
          position: 'a',
        },
      ],
      1
    );

    expect(result).toEqual({
      prev: 'a',
      next: null,
    });
  });

  it('returns nulls for a negative index', () => {
    const result = neighborsAtIndex(items, -1);

    expect(result).toEqual({
      prev: null,
      next: null,
    });
  });

  it('returns previous item and null when index is larger than array length', () => {
    const result = neighborsAtIndex(items, 10);

    expect(result).toEqual({
      prev: null,
      next: null,
    });
  });

  it('uses exact position values without modification', () => {
    const result = neighborsAtIndex(
      [
        {
          position: '0.0001',
        },
        {
          position: '0.0002',
        },
      ],
      1
    );

    expect(result).toEqual({
      prev: '0.0001',
      next: '0.0002',
    });
  });

  it('does not mutate the original array', () => {
    const original = [...items];

    neighborsAtIndex(items, 1);

    expect(items).toEqual(original);
  });

  it('works with duplicated positions', () => {
    const result = neighborsAtIndex(
      [
        {
          position: 'a',
        },
        {
          position: 'a',
        },
      ],
      1
    );

    expect(result).toEqual({
      prev: 'a',
      next: 'a',
    });
  });
});
