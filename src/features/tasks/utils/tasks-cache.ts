import { Task } from '@/features/tasks/types/tasks.types';
import { byTaskPosition } from '@/features/tasks/utils/tasks.utils';

export function findTask(tasks: Task[], id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function updateTaskInCache(
  tasks: Task[],
  id: string,
  patch: Partial<Task>
): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, ...patch } : task));
}

export function removeFromCache(tasks: Task[], task: Task): Task[] {
  if (task.parentTaskId) {
    return tasks.filter((t) => t.id !== task.id);
  }

  return tasks.filter((t) => t.id !== task.id && t.parentTaskId !== task.id);
}

export function restoreToCache(
  tasks: Task[],
  task: Task,
  cascadedSubtasks: Task[] = []
): Task[] {
  const alreadyPresent = tasks.some((t) => t.id === task.id);
  if (alreadyPresent) return tasks;

  return [...tasks, task, ...cascadedSubtasks].sort(byTaskPosition);
}
