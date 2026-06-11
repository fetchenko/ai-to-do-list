"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTask } from "@/features/tasks/tasks.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/features/tasks/tasks.types";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useState } from "react";

type AddTaskForm = Task;

export function AddTask() {
  const [open, setOpen] = useState(false)

  const { handleSubmit, register, reset } = useForm<AddTaskForm>({
    defaultValues: {
      title: "",
      description: '',
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
      setOpen(false);
    },
  })

  const onSubmit = (values: AddTaskForm) => {
    mutation.mutate(values)
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
    >
      <Card className="p-3">
        <CardContent className="p-0 space-y-3">
          <div className="flex gap-2">
            <Input
              {...register("title")}
              disabled={mutation.isPending}
              placeholder="Add a task..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(onSubmit)
              }}
            />

            <Button type="submit">
              Add
            </Button>
          </div>

          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-sm text-muted-foreground hover:underline"
              >
                {open ? "Hide description" : "Add description"}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2">
              <Textarea
                {...register("description")}
                disabled={mutation.isPending}
                placeholder="Add more details about this task..."
                className="resize-none"
              />
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>
    </form>
  );
}