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

export function getSiblings(tasks: Task[], parentTaskId: string | null) {
  return tasks
    .filter((task) => task.parentTaskId === parentTaskId)
    .sort((a, b) => a.position.localeCompare(b.position));
}

function computeNewPosition(
  tasks: Task[],
  parentTaskId: string | null,
  beforeId: string | null,
  afterId: string | null
) {
  const siblings = getSiblings(tasks, parentTaskId);
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

    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);

      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old?.map((t) =>
          t.id === taskId ? { ...t, position: 'optimistic' } : t
        )
      );

      return { previous };
    },

    onSuccess: ({ taskId, newPosition }) => {
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old?.map((t) => (t.id === taskId ? { ...t, position: newPosition } : t))
      );
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
