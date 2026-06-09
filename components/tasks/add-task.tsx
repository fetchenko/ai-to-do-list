"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTask } from "@/features/tasks/tasks.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/features/tasks/tasks.types";

type AddTaskForm = Task;

export function AddTask() {
  const { handleSubmit, register, reset } = useForm<AddTaskForm>({
    defaultValues: {
      title: "",
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTask: Task) =>
      await addTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
      reset();
    },
  })

  const onSubmit = (values: AddTaskForm) => {
    mutation.mutate(values)
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-start gap-3"
    >
      <Textarea
        {...register("title")}
        placeholder="Enter task..."
        className="flex-1 resize-none"
        disabled={mutation.isPending}
      />

      <Button type="submit" className="shrink-0">
        Add Task
      </Button>
    </form>
  );
}