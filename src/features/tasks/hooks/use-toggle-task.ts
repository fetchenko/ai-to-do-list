import { taskStatus } from '@/features/tasks/constants/task.constants';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { Task } from '@/features/tasks/types/tasks.types';
import { CheckedState } from '@radix-ui/react-checkbox';

export function useToggleTask(task: Task) {
  const { mutate, isPending } = useUpdateTaskMutation();

  const toggle = (checked: CheckedState) => {
    mutate({
      taskId: task.id,
      updates: {
        status: checked ? taskStatus.done : taskStatus.active,
      },
    });
  };

  return {
    checked: task.status === taskStatus.done,
    toggle,
    isPending,
  };
}
