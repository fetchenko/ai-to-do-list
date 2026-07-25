import { MenuAction } from '@/components/blocks/action-menu/types';
import { useBaseTaskActions } from '@/features/tasks/hooks/use-base-task-actions';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { Task } from '@/features/tasks/types/tasks.types';

export function useTaskActions(task: Task): MenuAction[] {
  const baseActions = useBaseTaskActions(task);

  const { generate } = useSubtaskDrafts(task.id);

  return [
    ...baseActions,

    {
      id: 'generate-subtasks',
      label: 'Generate subtasks',
      onSelect: generate,
    },
  ];
}
