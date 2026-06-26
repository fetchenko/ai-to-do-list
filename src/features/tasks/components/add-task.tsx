"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { taskSchema } from "@/features/tasks/validation/tasks";
import { z } from "zod";
import { addTask } from "../services/tasks.service";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskKeys } from "../constants/task.constants";

type TaskInput = z.infer<typeof taskSchema>;

type AddTaskProps = {
  isSubtask?: boolean;
  parentTaskId?: string;
}

export function AddTask({ isSubtask, parentTaskId }: AddTaskProps) {
  const [open, setOpen] = useState(false)

  const { handleSubmit, register, reset, formState: { errors }, } = useForm<TaskInput>(
    {
      resolver: zodResolver(taskSchema),
    }
  );

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
        queryKey: taskKeys.all,
      })
      reset();
      setOpen(false);
    },
  })

  const onSubmit = (values: TaskInput) => {
    mutation.mutate(values)
  };

  return (

    <Card className="p-3">
      <CardContent className="p-0 space-y-3">
        <form
          onSubmit={handleSubmit(onSubmit)}

        >
          <fieldset disabled={mutation.isPending} className="flex gap-2">
            <Input
              data-testid="add-task-input"
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
          </fieldset>

          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="text-sm text-muted-foreground ml-2 hover:underline"
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
        </form>
      </CardContent>
    </Card>
  );
}