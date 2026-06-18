import { updateTask } from "@/features/tasks/tasks.api";
import { Task } from "@/types/tasks";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => updateTask(taskId, updates),

    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: ["tasks"],
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
        queryKey: ["tasks"],
      });
    },
  });
}
