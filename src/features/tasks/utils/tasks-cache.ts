import { Task } from '@/features/tasks/types/tasks.types';
import { byPosition, updateParentSubtasks } from '@/features/tasks/utils/tasks';

export function findTask(tasks: Task[], id: string): Task | undefined {
  return (
    tasks.find((t) => t.id === id) ??
    tasks.flatMap((t) => t.subtasks ?? []).find((s) => s.id === id)
  );
}

export function updateTaskInCache(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((task) => {
    if (task.id === id) return { ...task, ...patch };

    const subtasks = task.subtasks?.map((subtask) =>
      subtask.id === id ? { ...subtask, ...patch } : subtask
    );

    const changed = subtasks?.some((s, i) => s !== task.subtasks?.[i]);

    return changed ? { ...task, subtasks } : task;
  });
}

export function removeFromCache(tasks: Task[], task: Task): Task[] {
  if (!task.parentTaskId) return tasks.filter((t) => t.id !== task.id);

  return updateParentSubtasks(tasks, task.parentTaskId, (subtasks) =>
    subtasks.filter((s) => s.id !== task.id)
  );
}

export function restoreToCache(tasks: Task[], task: Task): Task[] {
  if (!task.parentTaskId) {
    return [...tasks, task].sort(byPosition);
  }

  return updateParentSubtasks(tasks, task.parentTaskId, (subtasks) =>
    [...subtasks, task].sort(byPosition)
  );
}
