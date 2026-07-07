import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/task.constants';
import { softDeleteTask } from '@/features/tasks/repository/tasks.repository';
import { Task } from '@/features/tasks/types/tasks.types';
import {
  removeFromCache,
  restoreToCache,
} from '@/features/tasks/utils/tasks-cache';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

const UNDO_WINDOW_MS = 8000;

type PendingDelete = {
  task: Task;
  cascadedSubtasks: Task[];
  timeoutId: ReturnType<typeof setTimeout>;
};

export function useDeleteTaskWithUndo() {
  const queryClient = useQueryClient();
  const pendingRef = useRef<Map<string, PendingDelete>>(new Map());

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteTask(id),
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  async function deleteWithUndo(task: Task) {
    await queryClient.cancelQueries({ queryKey: taskKeys.all });

    const previous = queryClient.getQueryData<Task[]>(taskKeys.all) ?? [];
    const cascadedSubtasks = previous.filter((t) => t.parentTaskId === task.id);

    queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
      old ? removeFromCache(old, task) : old
    );

    const timeoutId = setTimeout(() => {
      pendingRef.current.delete(task.id);
      mutation.mutate(task.id);
      // Assumes the server cascade-deletes subtasks along with the parent.
    }, UNDO_WINDOW_MS);

    pendingRef.current.set(task.id, { task, cascadedSubtasks, timeoutId });

    const hasSubtasks = cascadedSubtasks.length > 0;

    toast(
      hasSubtasks
        ? `"${task.title}" and ${cascadedSubtasks.length} subtask${cascadedSubtasks.length > 1 ? 's' : ''} deleted`
        : `"${task.title}" deleted`,
      {
        duration: UNDO_WINDOW_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            const entry = pendingRef.current.get(task.id);
            if (!entry) return;

            clearTimeout(entry.timeoutId);
            pendingRef.current.delete(task.id);

            queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
              old
                ? restoreToCache(old, entry.task, entry.cascadedSubtasks)
                : old
            );
          },
        },
      }
    );
  }

  return { deleteWithUndo };
}
