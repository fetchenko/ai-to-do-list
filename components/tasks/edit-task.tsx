"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/store/useTaskStore";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/features/tasks/api";

type Task = {
  taskId: string;
  title: string;
};

interface TaskItemProps {
  task: Task;
}

type IFormInput = {
  title: string
}

export function EditTask({ task }: TaskItemProps) {
  const { stopEditing } = useTaskStore()
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ title, taskId }: Task) =>
      updateTask({ taskId, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
      stopEditing();
    },
  })

  const { register, handleSubmit } = useForm<IFormInput>({
    defaultValues: {
      title: task.title,
    },
  })

  const handleCancel = () => {
    stopEditing();
  };

  const handleSave = (data: IFormInput) => {
    mutation.mutate({ taskId: task.id, title: data.title })
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