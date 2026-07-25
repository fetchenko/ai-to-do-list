'use client';

import { memo } from 'react';

import { Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import EditTaskForm from '@/features/tasks/components/edit-task-form';
import SubtaskItem from '@/features/tasks/components/subtask-item';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';
import { useTaskActions } from '@/features/tasks/hooks/use-task-actions';
import { ActionMenu } from '@/components/blocks/action-menu';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
  className?: string;
};

function TaskItem({ task, subtasks, className }: TaskItemProps) {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);

  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const { drafts, isPending, discard } = useSubtaskDrafts(task.id);

  const isEditing = editingTaskId === task.id;
  const hasSubtasks = !!subtasks?.length;
  const showDraftPanel = isPending || drafts !== null;
  const { actions } = useTaskActions(task);

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
        {isEditing ? (
          <EditTaskForm task={task} />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <TaskCheckbox task={task} />
              <div className="min-w-0">
                <p
                  data-task-title={task.title}
                  id={`task-title-${task.id}`}
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
        )}

        {hasSubtasks && (
          <ul className="space-y-2" aria-label={`Subtasks for ${task.title}`}>
            {subtasks!.map((subtask) => (
              <li key={subtask.id}>
                <SubtaskItem task={subtask} />
              </li>
            ))}
          </ul>
        )}

        {showDraftPanel && (
          <div aria-live="polite" className="space-y-2">
            {isPending ? (
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                  Generating subtasks…
                </p>
                <TasksSkeleton />
              </>
            ) : (
              <DraftSubtasks
                task={task}
                drafts={drafts ?? []}
                onDiscard={discard}
              />
            )}
          </div>
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
