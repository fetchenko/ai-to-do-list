"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/store/useTaskStore";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/features/tasks/tasks.api";
import { Task } from "@/features/tasks/tasks.types";

type TaskItemProps = {
  task: Task;
}
type EditTaskForm = {
  title: string | null;
}

export function EditTask({ task }: TaskItemProps) {
  const { stopEditing } = useTaskStore()
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTask: EditTaskForm) =>
      updateTask({ ...task, title: newTask.title }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      stopEditing();
    },
  })

  const { register, handleSubmit } = useForm<EditTaskForm>({
    defaultValues: {
      title: task.title,
    },
  })

  const handleCancel = () => {
    stopEditing();
  };

  const handleSave = (newTask: EditTaskForm) => {
    mutation.mutate(newTask)
  }

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="flex items-center justify-between gap-3 w-full"
    >
      <Input
        {...register('title')}
        className="flex-1"
        disabled={mutation.isPending}
      />

      <div className="flex gap-2">
        <Button variant="default" size="sm" type="submit">
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>

  );
}