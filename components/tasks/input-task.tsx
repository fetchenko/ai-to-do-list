"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTask } from "@/features/tasks/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type FormValues = {
  task: string;
};

export function InputTask() {
  const { handleSubmit, register } = useForm<FormValues>({
    defaultValues: {
      task: "",
    },
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ title }: { title: String }) =>
      await addTask({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })

  const onSubmit = (values: FormValues) => {
    mutation.mutate({ title: values.task })
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-start gap-3"
    >
      <Textarea
        {...register("task")}
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