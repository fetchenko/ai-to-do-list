import { Task } from '@/features/tasks/types/tasks.types';

export const byPosition = (a: Task, b: Task) => a.position.localeCompare(b.position);

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

export async function filterDeletedSubtasks(tasks: Task[]) {
  return tasks.map((task) => ({
    ...task,
    subtasks: task.subtasks?.filter((subtask) => !subtask.deletedAt),
  }));
}
