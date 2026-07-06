import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateKeyBetween } from 'fractional-indexing';

import { taskKeys } from '@/features/tasks/constants/task.constants';
import { moveTask } from '@/features/tasks/repository/tasks.repository';
import { Task } from '@/features/tasks/types/tasks.types';

type ReorderArgs = {
  taskId: string;
  parentTaskId: string | null;
  beforeId: string | null;
  afterId: string | null;
};

function getSiblingList(tasks: Task[], parentTaskId: string | null): Task[] {
  if (parentTaskId === null) return tasks;
  const parent = tasks.find((t) => t.id === parentTaskId);
  return parent?.subtasks ?? [];
}

function computeNewPosition(
  tasks: Task[],
  parentTaskId: string | null,
  beforeId: string | null,
  afterId: string | null
) {
  const siblings = getSiblingList(tasks, parentTaskId);
  const before = siblings.find((t) => t.id === beforeId)?.position ?? null;
  const after = siblings.find((t) => t.id === afterId)?.position ?? null;

  return generateKeyBetween(before, after);
}

export function useReorderTask() {
  const queryClient = useQueryClient();

  const { mutate: reorderTask } = useMutation({
    mutationFn: async ({
      taskId,
      parentTaskId,
      beforeId,
      afterId,
    }: ReorderArgs) => {
      const tasks = queryClient.getQueryData<Task[]>(taskKeys.all) ?? [];

      const newPosition = computeNewPosition(
        tasks,
        parentTaskId,
        beforeId,
        afterId
      );

      await moveTask(taskId, newPosition);
      return { taskId, parentTaskId, newPosition };
    },

    onMutate: async ({ taskId, parentTaskId, beforeId, afterId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (old) => {
        if (!old) return old;

        const updateList = (list: Task[]) =>
          list.map((t) =>
            t.id === taskId
              ? { ...t, position: 'optimistic' } // optional placeholder
              : t
          );

        return old.map((t) => {
          if (parentTaskId === null) {
            return t.id === taskId ? { ...t, position: 'optimistic' } : t;
          }

          if (t.id !== parentTaskId) return t;

          return {
            ...t,
            subtasks: updateList(t.subtasks ?? []),
          };
        });
      });

      return { previous };
    },

    onSuccess: (data) => {
      const { taskId, newPosition } = data;

      queryClient.setQueryData<Task[]>(taskKeys.all, (old) => {
        if (!old) return old;

        return old.map((t) => {
          if (t.id === taskId) {
            return { ...t, position: newPosition };
          }

          if (!t.subtasks) return t;

          return {
            ...t,
            subtasks: t.subtasks.map((st) =>
              st.id === taskId ? { ...st, position: newPosition } : st
            ),
          };
        });
      });
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  return { reorderTask };
}
