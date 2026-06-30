'use client';

import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { TaskInputFields } from '@/features/tasks/components/task-input-fields';
import { Task } from '@/features/tasks/types/tasks.types';
import { TaskFormFields } from '@/features/tasks/schema/tasks';

type TaskItemProps = {
  task: Task;
};
type EditTaskForm = {
  title: string;
};

export default function SubtaskItem({ task }: TaskItemProps) {
  const updateTaskMutation = useUpdateTaskMutation();

  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const { deleteWithUndo } = useDeleteTaskWithUndo();

  const resetTaskStore = useTaskStore((state) => state.reset);

  const form = useForm<TaskFormFields>({
    defaultValues: {
      title: task.title,
      description: task.description || ""
    },
  });

  const handleCancel = () => {
    resetTaskStore();
  };

  const handleSave = (newTask: EditTaskForm) => {
    updateTaskMutation.mutate(
      {
        taskId: task.id,
        updates: newTask,
      },
      {
        onSuccess: () => {
          setEditingTaskId('');
        },
      }
    );
  };

  const editTask = (id: string) => {
    setEditingTaskId(id);
  };

  return (
    <Card
      data-testid="task-item"
      data-task-title={task.title}
      key={task.id}
      className="space-y-3 p-4"
    >
      <div className="flex w-full items-center justify-between gap-3">
        {editingTaskId && task.id === editingTaskId ? (
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="flex w-full items-center justify-between gap-3"
          >
            <TaskInputFields
              idPrefix={`edit-subtask`}
              form={form}
            />
            <div className="flex gap-2">
              <Button variant="default" size="sm" type="submit">
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <TaskCheckbox task={task} />
              <div>
                <p className="font-medium break-all">{task.title}</p>
                {task.description && (
                  <p className="text-muted-foreground text-sm break-all">{task.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger data-testid="task-actions-trigger" asChild>
                  <Button variant="outline" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => editTask(task.id)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="delete-task-button"
                    onClick={() => deleteWithUndo(task)}
                    className="text-red-500"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
