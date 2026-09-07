import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/query-keys';
import { updateTask } from '@/features/tasks/repository/tasks.repository';
import { Task, TaskUpdate } from '@/features/tasks/types/tasks.types';
import { updateTaskInCache } from '@/features/tasks/utils/tasks-cache';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: TaskUpdate;
    }) => updateTask(taskId, updates),

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

    onError: (error, __, context) => {
      queryClient.setQueryData(taskKeys.all, context?.previous);

      toast.info(getFriendlyErrorMessage(error));
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}
