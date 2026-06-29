'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { useToggleTask } from '@/features/tasks/hooks/use-toggle-task';
import { Task } from '@/features/tasks/types/tasks.types';
import { cn } from '@/shared/utils/classnames';

interface TaskCheckboxProps {
  task: Task;
  className?: string;
}

export function TaskCheckbox({ task, className }: TaskCheckboxProps) {
  const { checked, toggle, isPending } = useToggleTask(task);

  return (
    <Checkbox
      data-testid="task-checkbox"
      checked={checked}
      disabled={isPending}
      onCheckedChange={toggle}
      aria-label={checked ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
      className={cn('mt-1', className)}
    />
  );
}
