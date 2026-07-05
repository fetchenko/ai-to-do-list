import { AiTask, GroupedTasks, Task } from '@/features/tasks/types/tasks.types';

export const byPosition = (a: Task, b: Task) =>
  a.position.localeCompare(b.position);

export function updateParentSubtasks(
  tasks: Task[],
  parentId: string,
  updater: (subtasks: Task[]) => Task[]
): Task[] {
  return tasks.map((task) =>
    task.id === parentId
      ? {
          ...task,
          subtasks: updater(task.subtasks ?? []),
        }
      : task
  );
}

export function filterDeletedSubtasks(tasks: Task[]) {
  return tasks.map((task) => ({
    ...task,
    subtasks: task.subtasks?.filter((subtask: Task) => !subtask.deletedAt),
  }));
}

export function groupTasksByStatus(tasks: Task[]) {
  return tasks.reduce<GroupedTasks>(
    (acc, task) => {
      (acc[task.status] ??= []).push(task);
      return acc;
    },
    { active: [], done: [], archived: [] }
  );
}

export const normalizeAiTask = (task: AiTask) => ({
  id: task.id,
  title: task.title ?? undefined,
  description: task.description ?? undefined,
});

export const normalizeAiTasks = (tasks: AiTask[]) => tasks.map(normalizeAiTask);
