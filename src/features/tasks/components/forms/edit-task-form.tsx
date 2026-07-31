'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormError } from '@/components/blocks/form-error';
import { Button } from '@/components/ui/button';
import {
  DescriptionField,
  TitleField,
} from '@/features/tasks/components/forms/task-form-fields';
import { TASK_FORM_COPY } from '@/features/tasks/constants/task-form-copy.constants';
import { useUpdateTask } from '@/features/tasks/hooks/use-update-task';
import { TaskForm, taskSchema } from '@/features/tasks/schema/tasks';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';

type EditTaskProps = {
  task: Task;
};

export default function EditTaskForm({ task }: EditTaskProps) {
  const updateTask = useUpdateTask();
  const resetTaskStore = useTaskStore((state) => state.reset);

  // Derived, not passed in — a task IS a subtask iff it has a parent, so
  // this can't drift out of sync the way a prop threaded through
  // TaskRow -> SubtaskItem/TaskItem could.
  const variant = task.parentTaskId ? 'subtask' : 'task';
  const copy = TASK_FORM_COPY[variant];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
    },
  });

  const handleCancel = () => {
    resetTaskStore();
  };

  const onSubmit = handleSubmit(async (values) => {
    await updateTask.mutateAsync({
      taskId: task.id,
      updates: values,
    });
    resetTaskStore();
  });

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <fieldset
        className="space-y-4"
        disabled={isSubmitting || updateTask.isPending}
      >
        <FormError message={updateTask.error?.message} />

        <div className="w-full min-w-0 space-y-4">
          <TitleField
            register={register}
            errors={errors}
            autoFocus
            label={copy.title.label}
            placeholder={copy.title.placeholder}
          />
          <DescriptionField
            register={register}
            errors={errors}
            label={copy.description.label}
            placeholder={copy.description.placeholder}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="default" size="sm" type="submit" className="min-w-20 justify-center">
            {isSubmitting || updateTask.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              'Save'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </fieldset>
    </form>
  );
}