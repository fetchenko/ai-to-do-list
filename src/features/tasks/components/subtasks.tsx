"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubtaskStore } from "@/features/tasks/stores/use-subtask-store";
import { Task, TaskInsert } from "@/features/tasks/types/tasks.types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-update-task";
import { taskKeys, taskStatus } from "@/features/tasks/constants/task.constants";
import { CheckedState } from "@radix-ui/react-checkbox";
import { saveSubtasks } from "../services/subtasks.service";
import { Checkbox } from "@/components/ui/checkbox";
import { useDeleteTaskWithUndo } from "../hooks/use-delete-task-with-undo";

interface TaskSubtasksProps {
  task: Task
}

export function Subtasks({
  task
}: TaskSubtasksProps) {
  const updateTaskMutation = useUpdateTaskMutation()
  const draftSubtasks = useSubtaskStore(state => state.generatedSubtasks);
  const setGeneratedSubtasks = useSubtaskStore(state => state.setGeneratedSubtasks);
  const activeSubtaskId = useSubtaskStore(state => state.activeSubtaskId);
  const setActiveSubastkId = useSubtaskStore(state => state.setActiveSubtaskId);
  const updateSubtask = useSubtaskStore(state => state.updateSubtask);
  const draftSubtask = useSubtaskStore(state => state.draftSubtask);
  const setDraftSubtask = useSubtaskStore(state => state.setDraftSubtask);
  const resetActiveSubtask = useSubtaskStore(state => state.resetActiveSubtask);
  const queryClient = useQueryClient();
  const { deleteWithUndo } = useDeleteTaskWithUndo();

  const mutation = useMutation({
    mutationFn: async ({ subtasks }: { subtasks: TaskInsert[] }) =>
      saveSubtasks(task.id, subtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
      setGeneratedSubtasks('', [])
    }
  })

  if (mutation.isPending) {
    return (
      <div className="mt-4 space-y-3 border-l pl-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-9 flex-1" />
          </div>
        ))}
      </div>
    );
  }

  const startEditSubtask = (subtask: Task) => {
    setActiveSubastkId(subtask.id);
    setDraftSubtask(subtask.title)
  };

  const handleUpdateSubtask = (taskId: string) => {
    if (draftSubtasks && draftSubtasks.length) {
      updateSubtask(taskId, { title: draftSubtask })
    } else {
      updateTaskMutation.mutate({
        taskId: taskId,
        updates: { title: draftSubtask },
      }, {
        onSuccess: () => { }
      })
    }

    resetActiveSubtask()
  }

  const handleCancelEditSubtask = () => {
    resetActiveSubtask();
  }

  const toggleDone = (id: string, checked: CheckedState) => {
    const newStatus = (checked) ? taskStatus.done : taskStatus.active;

    updateTaskMutation.mutate({
      taskId: id,
      updates: { status: newStatus },
    }, {
      onSuccess: () => { }
    })
  }

  if (!task.subtasks?.length) return null;

  return (
    <div className="mt-4 border-l pl-4 space-y-3">
      {task.subtasks.map((subtask) => {
        const isEditing = activeSubtaskId && activeSubtaskId === subtask.id;

        return (
          <Card key={subtask.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {isEditing ? (
                  <form
                    className="flex items-center justify-between gap-3 w-full"
                    onSubmit={() => handleUpdateSubtask(subtask.id)}
                  >
                    <Input
                      autoFocus
                      value={draftSubtask ?? ""}
                      onChange={(e) =>
                        setDraftSubtask(e.target.value)
                      }
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" type="submit">
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEditSubtask}>
                        Cancel
                      </Button>
                    </div>
                  </form>

                ) : (
                  <div className="flex items-center gap-3">
                    <Checkbox
                      disabled={updateTaskMutation.isPending}
                      checked={subtask.status === taskStatus.done}
                      onCheckedChange={(value) => toggleDone(subtask.id, value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      {subtask.title}
                    </p>
                  </div>
                )}
              </div>

              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditSubtask(subtask)}
                >
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => deleteWithUndo(subtask)}
              >
                Delete
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
