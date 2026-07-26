'use client';

import { Card } from '@/components/ui/card';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';
import { useSubtaskActions } from '@/features/tasks/hooks/use-subtask-actions';
import { TaskRow } from '@/features/tasks/components/task-row';

type SubtaskItemProps = {
  task: Task;
};

export default function SubtaskItem({ task }: SubtaskItemProps) {
  const actions = useSubtaskActions(task);

  return (
    <Card
      data-testid={testIds.subtask.item}
      data-task-id={task.id}
      key={task.id}
      className="space-y-3 p-4"
    >
      <div className="flex w-full items-center justify-between gap-3">
        <TaskRow task={task} titleId={`subtask-title-${task.id}`} actions={actions} />
      </div>
    </Card>
  );
}
