"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubtaskStore } from "@/stores/use-subtask-store";
import { Task } from "@/types/tasks";
import { saveSubtasks } from "@/features/tasks/tasks.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TaskSubtasksProps {
  task: Task
}

export function DraftSubtasks({
  task
}: TaskSubtasksProps) {
  const draftSubtasks = useSubtaskStore(state => state.generatedSubtasks);
  const setGeneratedSubtasks = useSubtaskStore(state => state.setGeneratedSubtasks);
  const activeSubtaskId = useSubtaskStore(state => state.activeSubtaskId);
  const setActiveSubastkId = useSubtaskStore(state => state.setActiveSubtaskId);
  const updateSubtask = useSubtaskStore(state => state.updateSubtask);
  const deleteSubtask = useSubtaskStore(state => state.deleteSubtask);
  const draftSubtask = useSubtaskStore(state => state.draftSubtask);
  const setDraftSubtask = useSubtaskStore(state => state.setDraftSubtask);
  const resetActiveSubtask = useSubtaskStore(state => state.resetActiveSubtask);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ subtasks }: { id: string, subtasks: Task[] }) =>
      saveSubtasks(task.id, subtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      setGeneratedSubtasks('', [])
    },
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
    updateSubtask(taskId, { title: draftSubtask })
    resetActiveSubtask()
  }

  const handleCancelEditSubtask = () => {
    resetActiveSubtask();
  }

  const handleDeleteSubtask = (id: string) => {
    deleteSubtask(id)
  }

  const handleSaveSubtasks = async () => {
    mutation.mutate({ id: task.id, subtasks: draftSubtasks })
  }

  if (!draftSubtasks?.length) return null;

  return (
    <div className="mt-4 border-l pl-4 space-y-3">
      {draftSubtasks.map((subtask) => {
        const isEditing = activeSubtaskId && activeSubtaskId === subtask.id;

        return (
          <Card key={subtask.id} className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                {isEditing ? (
                  <form
                    className="flex items-center justify-between gap-3 w-full"
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
                      <Button variant="default" size="sm" type="submit"
                        onClick={() => handleUpdateSubtask(subtask.id)}
                      >
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEditSubtask}>
                        Cancel
                      </Button>
                    </div>
                  </form>

                ) : (
                  <div className="flex items-center gap-3">
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
                onClick={() =>
                  handleDeleteSubtask(subtask.id)
                }
              >
                Delete
              </Button>
            </div>
          </Card>
        );
      })}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline"
          disabled={mutation.isPending}
          onClick={() => setGeneratedSubtasks('', [])}
        >
          Reject All
        </Button>

        <Button
          disabled={mutation.isPending}
          onClick={() => handleSaveSubtasks()}
        >
          Accept All
        </Button>
      </div>
    </div>
  );
}
