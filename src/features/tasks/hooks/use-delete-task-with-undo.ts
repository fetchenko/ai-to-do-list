import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/query-keys';
import {
  restoreTask,
  softDeleteTask,
} from '@/features/tasks/repository/tasks.repository';
import { Task } from '@/features/tasks/types/tasks.types';
import {
  removeFromCache,
  restoreToCache,
} from '@/features/tasks/utils/tasks-cache';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

const TOAST_DURATION_MS = 8000;

type MutationContext = {
  previous: Task[] | undefined;
};

export function useDeleteTaskWithUndo() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation<void, Error, Task, MutationContext>({
    mutationFn: (task) => softDeleteTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old ? removeFromCache(old, task) : old
      );

      return { previous };
    },
    onError: (error, _task, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
      toast.error(getFriendlyErrorMessage(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  const restoreMutation = useMutation<void, Error, Task, MutationContext>({
    mutationFn: (task) => restoreTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old ? restoreToCache(old, task) : old
      );

      return { previous };
    },
    onError: (error, _task, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
      toast.error(getFriendlyErrorMessage(error));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  function deleteWithUndo(task: Task) {
    const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.all) ?? [];
    const cascadedSubtasks = previousTasks.filter(
      (t) => t.parentTaskId === task.id
    );
    const hasSubtasks = cascadedSubtasks.length > 0;

    deleteMutation.mutate(task);

    toast(
      hasSubtasks
        ? `"${task.title}" and ${cascadedSubtasks.length} subtask${cascadedSubtasks.length > 1 ? 's' : ''} deleted`
        : `"${task.title}" deleted`,
      {
        duration: TOAST_DURATION_MS,
        action: {
          label: 'Undo',
          onClick: () => restoreMutation.mutate(task),
        },
      }
    );
  }

  return { deleteWithUndo, isDeleting: deleteMutation.isPending };
}
