'use client';

import { Card } from '@/components/ui/card';
import { TaskRow } from '@/features/tasks/components/task-row';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';

type SubtaskItemProps = {
  task: Task;
};

export default function SubtaskItem({ task }: SubtaskItemProps) {
  return (
    <Card
      data-testid={testIds.subtask.item}
      data-task-id={task.id}
      className="space-y-3 p-3"
    >
      <TaskRow task={task} titleId={`subtask-title-${task.id}`} />
    </Card>
  );
}
