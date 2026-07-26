'use client';

import { ReactNode } from 'react';

import EditTaskForm from '@/features/tasks/components/edit-task-form';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';
import { ActionMenu } from '@/components/blocks/action-menu';
import { MenuAction } from '@/components/blocks/action-menu/types';

type TaskRowProps = {
  task: Task;
  titleId: string;
  actions: MenuAction[];
  leading?: ReactNode;
};

export function TaskRow({ task, actions, titleId, leading }: TaskRowProps) {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);

  const isEditing = editingTaskId === task.id;

  if (isEditing) return (<EditTaskForm task={task} />)

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {leading}
        <TaskCheckbox task={task} />
        <div className="min-w-0">
          <p
            id={titleId}
            className="font-medium break-words"
          >
            {task.title}
          </p>
          {task.description && (
            <p className="text-muted-foreground text-sm break-words">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <ActionMenu
        actions={actions}
        label={`Actions for ${task.title}`}
      />
    </div>
  )
}