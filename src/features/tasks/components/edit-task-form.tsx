'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { TaskInputFields } from '@/features/tasks/components/task-input-fields';
import { Task } from '@/features/tasks/types/tasks.types';
import { TaskFormFields } from '@/features/tasks/schema/tasks';

type EditTaskProps = {
  task: Task;
};

export default function EditTaskForm({ task }: EditTaskProps) {
  const updateTaskMutation = useUpdateTaskMutation();

  const resetTaskStore = useTaskStore((state) => state.reset);

  const { register, formState, handleSubmit } = useForm<TaskFormFields>({
    defaultValues: {
      title: task.title,
      description: task.description || ""
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
          resetTaskStore()
        },
      }
    );
  };


  return (
    <form
      onSubmit={handleSubmit(handleSave)}
      className="w-full"
    >
      <fieldset
        className="flex w-full items-center justify-between gap-3"
        disabled={updateTaskMutation.isPending}>
        <TaskInputFields
          register={register}
          errors={formState.errors}
        />
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
