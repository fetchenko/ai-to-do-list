import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useToggleTask } from '@/features/tasks/hooks/use-toggle-task';
import { Task } from '@/features/tasks/types/tasks.types';

export function useTaskActions(task: Task) {
  const toggleTask = useToggleTask(task);

  const { deleteWithUndo } = useDeleteTaskWithUndo();

  return {
    toggle: {
      execute: toggleTask.toggle,
      checked: toggleTask.checked,
      isPending: toggleTask.isPending,
    },

    remove: {
      execute: () => deleteWithUndo(task),
    },
  };
}
