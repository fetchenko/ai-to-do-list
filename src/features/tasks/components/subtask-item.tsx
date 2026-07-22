'use client';

import { Card } from '@/components/ui/card';
import EditTaskForm from '@/features/tasks/components/edit-task-form';
import { TaskActionsMenu } from '@/features/tasks/components/task-action-menu';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';
import { testIds } from '@/shared/testing/test-ids';

type SubtaskItemProps = {
  task: Task;
};
type EditTaskForm = {
  title: string;
};

export default function SubtaskItem({ task }: SubtaskItemProps) {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const { deleteWithUndo } = useDeleteTaskWithUndo();

  const editTask = (id: string) => {
    setEditingTaskId(id);
  };

  return (
    <Card
      data-testid={testIds.subtask.item}
      data-task-id={task.id}
      key={task.id}
      className="space-y-3 p-4"
    >
      <div className="flex w-full items-center justify-between gap-3">
        {editingTaskId && task.id === editingTaskId ? (
          <EditTaskForm task={task} />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <TaskCheckbox task={task} />
              <div>
                <p className="font-medium break-all">{task.title}</p>
                {task.description && (
                  <p className="text-muted-foreground text-sm break-all">
                    {task.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <TaskActionsMenu
                onEdit={() => editTask(task.id)}
                onDelete={() => deleteWithUndo(task)}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
