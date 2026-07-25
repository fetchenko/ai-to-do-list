import { MenuAction } from '@/components/blocks/action-menu/types';
import { useBaseTaskActions } from '@/features/tasks/hooks/use-base-task-actions';
import { Task } from '@/features/tasks/types/tasks.types';

export function useTaskActions(
  task: Task,
  onGenerateSubtasks: () => void
): MenuAction[] {
  const baseActions = useBaseTaskActions(task);

  return [
    ...baseActions,

    {
      id: 'generate-subtasks',
      label: 'Generate subtasks',
      onSelect: onGenerateSubtasks,
    },
  ];
}
