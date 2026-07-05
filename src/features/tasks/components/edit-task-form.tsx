'use client';

import { useForm } from 'react-hook-form';

import { FormError } from '@/components/blocks/form-error';
import { FormField } from '@/components/primitives/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { TaskFormFields } from '@/features/tasks/schema/tasks';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';

type EditTaskProps = {
  task: Task;
};

export default function EditTaskForm({ task }: EditTaskProps) {
  const updateTaskMutation = useUpdateTaskMutation();

  const resetTaskStore = useTaskStore((state) => state.reset);

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<TaskFormFields>({
    defaultValues: {
      title: task.title,
      description: task.description || '',
    },
  });

  const handleCancel = () => {
    resetTaskStore();
  };

  const handleSave = (newTask: TaskFormFields) => {
    updateTaskMutation.mutate(
      {
        taskId: task.id,
        updates: newTask,
      },
      {
        onSuccess: () => {
          resetTaskStore();
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(handleSave)} className="w-full">
      <fieldset
        className="flex w-full items-center justify-between gap-3"
        disabled={updateTaskMutation.isPending}
      >
        <FormError message={updateTaskMutation.error?.message} />

        <div className="w-full min-w-0 space-y-4">
          <div className="space-y-1.5">
            <FormField
              idPrefix="edit-title"
              label="Task"
              error={errors.title?.message}
            >
              <Input
                id="add-title"
                autoFocus
                placeholder="Edit a task"
                aria-invalid={!!errors?.title}
                aria-describedby={
                  !!errors?.title ? `add-title-error` : undefined
                }
                {...register('title')}
              />
            </FormField>
          </div>
          <div className="space-y-1.5">
            <FormField
              idPrefix="edit-description"
              label="Description (optional)"
              error={errors.description?.message}
            >
              <Textarea
                id="edit-description"
                rows={3}
                placeholder="Add detail for this task"
                className="resize-y"
                aria-invalid={!!errors.description}
                aria-describedby={
                  !!errors.description ? `add-description-error` : undefined
                }
                {...register('description')}
              />
            </FormField>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" type="submit">
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
