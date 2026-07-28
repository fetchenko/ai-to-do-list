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
    } catch {
      // Failure is already surfaced via the mutation's `error` state
      // (AddTaskForm's `error` prop) — nothing left to do here but bail
      // before the reset/focus below, which are success-only steps.
      return;
    }

    form.reset();
    setIsDescriptionOpen(false);
    form.setFocus('title'); // let people add several tasks without reaching for the mouse
  });

  return {
    ...form,
    onSubmit,
    isDescriptionOpen,
    setIsDescriptionOpen,
  };
}
