'use client';

import { memo } from 'react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/forms/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/forms/draft-subtasks-form';
import SubtaskList from '@/features/tasks/components/subtask-list';
import { TaskRow } from '@/features/tasks/components/task-row';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
};

function TaskItem({ task, subtasks }: TaskItemProps) {
  const { mutateAsync: createTask, error } = useCreateTask(task.id);

  return (
    <Card data-testid={testIds.task.item} data-task-id={task.id}>
      <article
        aria-labelledby={`task-title-${task.id}`}
        className="space-y-3 p-4"
      >
        <TaskRow task={task} titleId={`task-title-${task.id}`} />

        <SubtaskList parentTitle={task.title} subtasks={subtasks} />

        <DraftSubtasks task={task} />

        <AddTaskForm variant="subtask" error={error} onAddTask={createTask} />
      </article>
    </Card>
  );
}

export default memo(TaskItem);
