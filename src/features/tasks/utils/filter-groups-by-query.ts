import { Task, TaskGroup } from '@/features/tasks/types/tasks.types';

/**
 * Filters task groups by a search query, matching against title/description.
 * A parent stays visible if it OR any of its subtasks match; in that case
 * only matching subtasks are kept, unless the parent itself matched (then
 * all of its subtasks stay, so the group doesn't fragment mid-render).
 */

export function filterGroupsByQuery(
  groups: TaskGroup[],
  query: string
): TaskGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  const matches = (task: Task) =>
    task.title.toLowerCase().includes(q) ||
    !!task.description?.toLowerCase().includes(q);

  return groups
    .map(({ parent, subtasks }) => ({
      parent,
      subtasks: matches(parent) ? subtasks : subtasks.filter(matches),
    }))
    .filter(({ parent, subtasks }) => matches(parent) || subtasks.length > 0);
}
