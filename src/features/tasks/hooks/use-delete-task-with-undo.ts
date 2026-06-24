import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { softDeleteTask } from "../repository/tasks.repository";
import { Task } from "../types/tasks.types";
import { getFriendlyErrorMessage } from "@/shared/errors/error-messages";
import { taskKeys } from "../constants/task.constants";

const UNDO_WINDOW_MS = 8000;

function removeFromCache(tasks: Task[], task: Task): Task[] {
  if (!task.parentTaskId) {
    return tasks.filter((t) => t.id !== task.id);
  }
  return tasks.map((t) =>
    t.id === task.parentTaskId
      ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== task.id) }
      : t,
  );
}

function restoreToCache(tasks: Task[], task: Task): Task[] {
  if (!task.parentTaskId) {
    return [...tasks, task].sort((a, b) =>
      a.position.localeCompare(b.position),
    );
  }
  return tasks.map((t) =>
    t.id === task.parentTaskId
      ? {
          ...t,
          subtasks: [...(t.subtasks || []), task].sort((a, b) =>
            a.position.localeCompare(b.position),
          ),
        }
      : t,
  );
}

export function useDeleteTaskWithUndo() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => softDeleteTask(id),
    onError: (error, _id, _ctx) => {
      toast.error(getFriendlyErrorMessage(error));

      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });

  function deleteWithUndo(task: Task) {
    queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
      old ? removeFromCache(old, task) : old,
    );

    let undone = false;
    const timeoutId = setTimeout(() => {
      if (!undone) mutation.mutate(task.id);
    }, UNDO_WINDOW_MS);

    toast(`"${task.title}" deleted`, {
      duration: UNDO_WINDOW_MS,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          clearTimeout(timeoutId);
          queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
            old ? restoreToCache(old, task) : old,
          );
        },
      },
    });
  }

  return { deleteWithUndo };
}
