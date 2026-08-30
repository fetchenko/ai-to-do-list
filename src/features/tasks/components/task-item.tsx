'use client';

import { memo } from 'react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/forms/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';
import { TaskRow } from '@/features/tasks/components/task-row';
import SubtaskList from '@/features/tasks/components/subtask-list';
import { useBaseTaskActions } from '@/features/tasks/hooks/use-base-task-actions';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
  className?: string;
};

function TaskItem({ task, subtasks, className }: TaskItemProps) {
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask(task.id);

  const actions = useBaseTaskActions(task);

  return (
    <Card
      data-testid={testIds.task.item}
      data-task-id={task.id}
      className={className}
    >
      <article
        aria-labelledby={`task-title-${task.id}`}
        className="space-y-3 p-4"
      >
        <TaskRow task={task} titleId={`task-title-${task.id}`} actions={actions} />

        <SubtaskList parentTitle={task.title} subtasks={subtasks} />

        <DraftSubtasks task={task} />
        <AddTaskForm
          variant="subtask"
          error={createTaskError}
          onAddTask={createTask}
        />
      </article>
    </Card>
  );
}

export default memo(TaskItem);
