'use client';

import EditTaskForm from '@/features/tasks/components/edit-task-form';
import { TaskActionsMenu } from '@/features/tasks/components/task-action-menu';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';

type TaskContentProps = {
  task: Task;
  showGenerate?: boolean;
  onGenerateSubtasks?: () => void;
};

export function TaskView({
  task,
  showGenerate = false,
  onGenerateSubtasks
}: TaskContentProps) {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const { deleteWithUndo } = useDeleteTaskWithUndo();

  if (editingTaskId === task.id) {
    return <EditTaskForm task={task} />
  }

  return (

    <div className="flex flex-1 items-start justify-between gap-3">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <TaskCheckbox task={task} aria-label={`Mark "${task.title}" complete`} />
        <div className="min-w-0">
          <p className="font-medium break-words">
            {task.id.slice(0, 5).toUpperCase()}
            {'    '}
            {task.title}
          </p>
          {task.description && (
            <p className="text-muted-foreground text-sm break-words">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <TaskActionsMenu
        onEdit={() => setEditingTaskId(task.id)}
        onDelete={() => deleteWithUndo(task)}
        showGenerate={showGenerate}
        onGenerateSubtasks={onGenerateSubtasks}
      />
    </div>
  )
}