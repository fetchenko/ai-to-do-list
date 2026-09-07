import { Task, TaskGroup } from '@/features/tasks/types/tasks.types';

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
