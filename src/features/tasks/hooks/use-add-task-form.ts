import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { TaskForm, taskSchema } from '@/features/tasks/schema/tasks';

export function useAddTaskForm(
  onAddTask: (values: TaskForm) => Promise<unknown>
) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  const form = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onAddTask(values);
      form.reset();
      setIsDescriptionOpen(false);
      // Refocus the title field so people can add several tasks in a row
      // without reaching for the mouse.
      form.setFocus('title');
    } catch {
      // Swallowed intentionally: the caller surfaces the failure via the
      // `error` state from its mutation (see AddTaskForm's `error` prop).
      // Re-throwing here would just produce an unhandled rejection since
      // nothing awaits this submit handler's promise.
    }
  });

  return {
    ...form,
    onSubmit,
    isDescriptionOpen,
    setIsDescriptionOpen,
  };
}
