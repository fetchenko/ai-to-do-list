"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskStore } from "@/stores/use-task-store";
import { useForm } from "react-hook-form";
import { Task } from "@/types/tasks";
import { useUpdateTaskMutation } from "@/features/tasks/hooks/use-update-task";
import { taskSchema } from "@/lib/validation/task";
import z from "zod";

type TaskItemProps = {
  task: Task;
}

type TaskInput = z.infer<typeof taskSchema>;


export function EditTask({ task }: TaskItemProps) {
  const updateTaskMutation = useUpdateTaskMutation()

  const resetTaskStore = useTaskStore(state => state.reset)

  const { register, handleSubmit, formState: { errors } } = useForm<TaskInput>({
    defaultValues: {
      title: task.title || "",
    },
  })

  const handleCancel = () => {
    resetTaskStore();
  };

  const handleSave = (newTask: TaskInput) => {
    updateTaskMutation.mutate({ taskId: task.id, updates: newTask }, {
      onSuccess: () => {
        resetTaskStore();
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="flex items-center justify-between gap-3 w-full"
    >
      <Input
        {...register('title')}
        className="flex-1"
        disabled={updateTaskMutation.isPending}
      />
      {errors.title && <p className="text-red-500">{errors.title.message}</p>}
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