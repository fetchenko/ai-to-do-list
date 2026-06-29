import { useMutation, useQueryClient } from '@tanstack/react-query';

import { taskKeys } from '@/features/tasks/constants/task.constants';
import { updateTask } from '@/features/tasks/repository/tasks.repository';
import { Task, TaskUpdate } from '@/features/tasks/types/tasks.types';
import { updateTaskInCache } from '@/features/tasks/utils/tasks-cache';

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: TaskUpdate }) =>
      updateTask(taskId, updates),

    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: taskKeys.all,
      });

      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData(taskKeys.all, (old: Task[] = []) =>
        updateTaskInCache(old, taskId, updates)
      );

      return { previous };
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(taskKeys.all, context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}
