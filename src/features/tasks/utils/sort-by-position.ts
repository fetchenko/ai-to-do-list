import { Task } from '@/features/tasks/types/tasks.types';

/**
 * Positions are compared lexicographically using the ordering
 * defined by the fractional-indexing algorithm.
 */
export const byPosition = (a: Task, b: Task) => {
  if (a.position === b.position) return 0;

  return a.position < b.position ? -1 : 1;
};
