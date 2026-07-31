import { AiTask, Task, TaskGroup } from '@/features/tasks/types/tasks.types';

export const byPosition = (a: Task, b: Task) =>
  a.position.localeCompare(b.position);

export const normalizeAiTask = (task: AiTask) => ({
  id: task.id,
  title: task.title ?? undefined,
  description: task.description ?? undefined,
});

export const normalizeAiTasks = (tasks: AiTask[]) => tasks.map(normalizeAiTask);

export function buildGroups(tasks: Task[]): TaskGroup[] {
  const bySiblingKey = new Map<string | null, Task[]>();

  for (const task of tasks) {
    const key = task.parentTaskId;
    const siblings = bySiblingKey.get(key);
    if (siblings) siblings.push(task);
    else bySiblingKey.set(key, [task]);
  }

  const topLevel = bySiblingKey.get(null) ?? [];
  return topLevel.map((parent) => ({
    parent,
    subtasks: bySiblingKey.get(parent.id) ?? [],
  }));
}

export function groupTasksByStatus(tasks: Task[]) {
  const groups = buildGroups(tasks);
  const initial: Record<Task['status'], TaskGroup[]> = {
    active: [],
    done: [],
    archived: [],
  };

  return groups.reduce((acc, group) => {
    const bucket = acc[group.parent.status];
    if (bucket) bucket.push(group);

    return acc;
  }, initial);
}

/**
 * Filters task groups by a search query, matching against title/description.
 * A parent stays visible if it OR any of its subtasks match; in that case
 * only matching subtasks are kept, unless the parent itself matched (then
 * all of its subtasks stay, so the group doesn't fragment mid-render).
 */
export function filterGroupsByQuery(groups: TaskGroup[], query: string): TaskGroup[] {
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
