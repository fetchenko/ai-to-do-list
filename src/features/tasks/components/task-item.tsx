'use client';

import { memo } from 'react';

import { Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { Task } from '@/features/tasks/types/tasks.types';
import { TaskContent } from '@/features/tasks/components/task-content';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
  className?: string;
};

function TaskItem({ task, subtasks, className }: TaskItemProps) {
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const { drafts, generate, isPending, discard } = useSubtaskDrafts(task.id);

  const showDraftPanel = isPending || drafts !== null;

  return (
    <Card
      data-testid="task-item"
      data-task-title={task.title}
      className={className}
    >
      <article
        aria-labelledby={`task-title-${task.id}`}
        className="space-y-3 p-4"
      >
        <TaskContent
          task={task}
          showGenerate
          onGenerateSubtasks={generate}
        />

        {subtasks.length > 0 && (
          <ul className="space-y-2" aria-label={`Subtasks for ${task.title}`}>
            {subtasks.map((subtask) => (
              <li key={subtask.id}>
                <Card className="space-y-3 p-4">
                  <TaskContent task={subtask} />
                </Card>
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
