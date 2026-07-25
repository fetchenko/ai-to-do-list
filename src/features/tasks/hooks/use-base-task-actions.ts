import { MenuAction } from '@/components/blocks/action-menu/types';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';

export function useBaseTaskActions(task: Task): MenuAction[] {
  const setEditingTaskId = useTaskStore((s) => s.setEditingTaskId);

  const { deleteWithUndo } = useDeleteTaskWithUndo();

  return [
    {
      id: 'edit',
      label: 'Edit',
      onSelect: () => setEditingTaskId(task.id),
    },

    {
      id: 'delete',
      label: 'Delete',
      variant: 'destructive',
      onSelect: () => deleteWithUndo(task),
    },
  ];
}
