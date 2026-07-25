import { useBaseTaskActions } from '@/features/tasks/hooks/use-base-task-actions';
import { Task } from '@/features/tasks/types/tasks.types';

export function useSubtaskActions(task: Task) {
  return useBaseTaskActions(task);
}
