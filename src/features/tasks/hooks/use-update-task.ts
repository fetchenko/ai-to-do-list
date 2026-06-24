import { updateTask } from "@/features/tasks/repository/tasks.repository";
import { Task, TaskUpdate } from "@/features/tasks/types/tasks.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskKeys } from "../constants/task.constants";

export function useUpdateTaskMutation() {
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

      const previous = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueryData(["tasks"], (old: Task[] = []) =>
        old.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task,
        ),
      );

      return { previous };
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(["tasks"], context?.previous);
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
  });
}
