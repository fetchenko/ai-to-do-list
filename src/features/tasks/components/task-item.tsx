'use client';

import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { useSubtaskStore } from '@/features/tasks/stores/use-subtask-store';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { AiTask, Task } from '@/features/tasks/types/tasks.types';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { TaskInputFields } from '@/features/tasks/components/task-input-fields';
import SubtaskItem from '@/features/tasks/components/subtask-item';

type TaskItemProps = {
  task: Task;
};
type EditTaskForm = {
  title: string;
};

export default function TaskItem({ task }: TaskItemProps) {
  const updateTaskMutation = useUpdateTaskMutation();

  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const setGeneratedSubtasks = useSubtaskStore((state) => state.setGeneratedSubtasks);
  const generateSubtaskForTask = useSubtaskStore((state) => state.generateSubtaskForTask);
  const setGeneratedSubtasksForTask = useSubtaskStore((state) => state.setGeneratedSubtasksForTask);
  const { deleteWithUndo } = useDeleteTaskWithUndo();
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const mutationSubtasks = useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new AppError(ErrorCode.INVALID_REQUEST, 400, 'Missing task id');

      return await generateSubtasks(id);
    },
    onSuccess: (data: AiTask[]) => {
      setGeneratedSubtasks(task.id, data);
    },
    onError: (error) => {
      setGeneratedSubtasksForTask(null);
      if (error instanceof AppError) {
        toast.info(getFriendlyErrorMessage(error));
        return;
      }
    },
  });

  const resetTaskStore = useTaskStore((state) => state.reset);

  const form = useForm<EditTaskForm>({
    defaultValues: {
      title: task.title,
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

  const handleGenerateSubtasks = (id: string) => {
    setGeneratedSubtasksForTask(id);
    mutationSubtasks.mutate(id);
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
              idPrefix={`edit-task`}
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
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-muted-foreground text-sm">{task.description}</p>
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
                  <DropdownMenuItem
                    data-testid="generate-subtasks-button"
                    // disabled={mutationSubtasks.isPending}
                    onClick={() => handleGenerateSubtasks(task.id)}
                  >
                    Gen subtask
                  </DropdownMenuItem>
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

      {!!task.subtasks?.length && task.subtasks.map((subtask) => (
        <SubtaskItem key={subtask.id} task={subtask} />
      ))}
      <AddTaskForm
        error={createTaskError}
        onAddTask={(values) => createTask({ ...values, parentTaskId: task.id })}
      />
      {generateSubtaskForTask && generateSubtaskForTask === task.id && (
        <>
          {mutationSubtasks.isPending && <p>generating subtasks</p>}
          {mutationSubtasks.isPending && <TasksSkeleton />}
          <DraftSubtasks task={task} />
        </>
      )}
    </Card>
  );
}
