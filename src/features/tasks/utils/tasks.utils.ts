import { AiTask, Task, TaskGroup } from '@/features/tasks/types/tasks.types';

export const byTaskPosition = (a: Task, b: Task) =>
  a.position < b.position ? -1 : a.position > b.position ? 1 : 0;

export const normalizeAiTask = (task: AiTask) => ({
  id: task.id,
  title: task.title ?? undefined,
  description: task.description ?? undefined,
});

export const normalizeAiTasks = (tasks: AiTask[]) => tasks.map(normalizeAiTask);

export function groupTasksByParent(tasks: Task[]): TaskGroup[] {
  const taskMap = new Map<string, Task[]>();

  for (const task of tasks) {
    if (task.parentTaskId) {
      const children = taskMap.get(task.parentTaskId) ?? [];
      children.push(task);
      taskMap.set(task.parentTaskId, children);
    }
  }

  const result = [...tasks]
    .filter((task) => task.parentTaskId === null)
    .map((parent) => ({
      parent,
      subtasks: taskMap.get(parent.id) ?? [],
    }))
    .sort((a, b) => byTaskPosition(a.parent, b.parent));

  return result;
}

export function groupTasksByStatus(tasks: Task[]) {
  const groups = groupTasksByParent([...tasks]);
  const initial: Record<Task['status'], TaskGroup[]> = {
    active: [],
    done: [],
    archived: [],
  };

  const grouped = groups.reduce((acc, group) => {
    const bucket = acc[group.parent.status];
    if (bucket) bucket.push(group);

    return acc;
  }, initial);

  return grouped;
}
