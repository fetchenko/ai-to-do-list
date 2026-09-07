'use client';

import { ReactNode } from 'react';

import { ActionMenu } from '@/components/blocks/action-menu';
import EditTaskForm from '@/features/tasks/components/forms/edit-task-form';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { useBaseTaskActions } from '@/features/tasks/hooks/use-base-task-actions';
import { useToggleTask } from '@/features/tasks/hooks/use-toggle-task';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';

type TaskRowProps = {
  task: Task;
  titleId: string;
  leading?: ReactNode;
};

export function TaskRow({ task, titleId, leading }: TaskRowProps) {
  const actions = useBaseTaskActions(task);

  const { checked, isPending, toggle } = useToggleTask(task);

  const editingTaskId = useTaskStore((state) => state.editingTaskId);

  if (task.id === editingTaskId) return <EditTaskForm task={task} />;

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading}

        <TaskCheckbox
          checked={checked}
          disabled={isPending}
          label={task.title}
          onCheckedChange={toggle}
        />

        <div className="min-w-0">
          <p id={titleId} className="font-medium break-words">
            {task.title}
          </p>
          {task.description && (
            <p className="text-muted-foreground text-sm break-words">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <ActionMenu actions={actions} label={`Actions for ${task.title}`} />
    </div>
  );
}
