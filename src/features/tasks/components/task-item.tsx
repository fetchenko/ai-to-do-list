'use client';

import { memo } from 'react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';
import { useTaskActions } from '@/features/tasks/hooks/use-task-actions';
import { TaskRow } from '@/features/tasks/components/task-row';
import { SubtaskList } from '@/features/tasks/components/subtask-list';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
  className?: string;
};

function TaskItem({ task, subtasks, className }: TaskItemProps) {
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const { drafts, isPending, generate, discard } = useSubtaskDrafts(task.id);

  const actions = useTaskActions(task, generate);

  const showDraftPanel = isPending || drafts !== null;

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

        <SubtaskList label={`Subtasks for ${task.title}`} subtasks={subtasks} />

        {showDraftPanel && (
          <DraftSubtasks
            loading={isPending}
            task={task}
            drafts={drafts ?? []}
            onDiscard={discard}
          />
        )}
        <AddTaskForm
          error={createTaskError}
          onAddTask={(values) =>
            createTask({ ...values, parentTaskId: task.id })
          }
        />
      </article>
    </Card>
  );
}

export default memo(TaskItem);
