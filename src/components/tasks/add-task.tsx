"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTask } from "@/features/tasks/tasks.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { useState } from "react";
import { taskSchema } from "@/lib/validation/task";
import { z } from "zod";

type TaskInput = z.infer<typeof taskSchema>;

type AddTaskProps = {
  isSubtask?: boolean;
  parentTaskId?: string;
}

export function AddTask({ isSubtask, parentTaskId }: AddTaskProps) {
  const [open, setOpen] = useState(false)

  const { handleSubmit, register, reset, formState: { errors }, } = useForm<TaskInput>();

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newTask: TaskInput) => {
      if (isSubtask && parentTaskId) {
        return addTask(parentTaskId, { ...newTask, parentTaskId: parentTaskId })
      }

      return await addTask(null, newTask)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
      reset();
      setOpen(false);
    },
  })

  const onSubmit = (values: TaskInput) => {
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
              placeholder={`Add a ${isSubtask ? 'subtask' : 'task'}...`}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(onSubmit)
              }}
            />
            {errors.title && <p className="text-red-500">{errors.title.message}</p>}
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
              {errors.description && <p className="text-red-500">{errors.description.message}</p>}
            </CollapsibleContent>
          </Collapsible>

        </CardContent>
      </Card>
    </form>
  );
}