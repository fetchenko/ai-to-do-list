'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { toast } from "sonner"
import { useMutation } from '@tanstack/react-query';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { AiTask, Task } from '@/features/tasks/types/tasks.types';
import { useSubtaskStore } from '@/features/tasks/stores/use-subtask-store';
import { useForm } from 'react-hook-form';
import { taskStatus } from '@/features/tasks/constants/task.constants';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { DraftSubtasks } from './draft-subtasks';
import { CheckedState } from '@radix-ui/react-checkbox';
import { AddTaskForm } from './add-task-form';
import TasksSkeleton from './tasks-skeleton';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { generateSubtasks } from '../services/subtasks.service';
import { Subtasks } from './subtasks';
import { useDeleteTaskWithUndo } from '../hooks/use-delete-task-with-undo';
import { useCreateTask } from '../hooks/use-create-task';

type TaskItemProps = {
  task: Task;
}
type EditTaskForm = {
  title: string;
}

export default function TaskItem({ task }: TaskItemProps) {
  const updateTaskMutation = useUpdateTaskMutation()

  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const setGeneratedSubtasks = useSubtaskStore((state) => state.setGeneratedSubtasks);
  const generateSubtaskForTask = useSubtaskStore(state => state.generateSubtaskForTask);
  const setGeneratedSubtasksForTask = useSubtaskStore(state => state.setGeneratedSubtasksForTask)
  const { deleteWithUndo } = useDeleteTaskWithUndo();
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const mutationSubtasks = useMutation({
    mutationFn: async (id: string) => {
      if (!id) throw new AppError(ErrorCode.INVALID_REQUEST, 400, "Missing task id");

      return await generateSubtasks(id);
    },
    onSuccess: (data: AiTask[]) => {
      setGeneratedSubtasks(task.id, data);
    },
    onError: (error) => {
      setGeneratedSubtasksForTask(null)
      if (error instanceof AppError) {
        toast.info(getFriendlyErrorMessage(error));
        return;
      }
    }
  });


  const resetTaskStore = useTaskStore(state => state.reset)

  const { register, handleSubmit } = useForm<EditTaskForm>({
    defaultValues: {
      title: task.title,
    },
  })

  const handleCancel = () => {
    resetTaskStore();
  };

  const handleSave = (newTask: EditTaskForm) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: newTask,
    }, {
      onSuccess: () => {
        setEditingTaskId('');
      }
    })
  }

  const toggleDone = (checked: CheckedState) => {
    const newStatus = checked ? taskStatus.done : taskStatus.active

    updateTaskMutation.mutate({
      taskId: task.id,
      updates: {
        status: newStatus
      },
    }, { onSuccess: () => { } })
  };

  const handleGenerateSubtasks = (id: string) => {
    setGeneratedSubtasksForTask(id);
    mutationSubtasks.mutate(id)
  };

  const editTask = (id: string) => {
    setEditingTaskId(id);
  };

  return (
    <Card data-testid='task-item' data-task-title={task.title} key={task.id} className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 w-full">
        {editingTaskId && task.id === editingTaskId ? (
          <form
            onSubmit={handleSubmit(handleSave)}
            className="flex items-center justify-between gap-3 w-full"
          >
            <Input
              {...register('title')}
              className="flex-1"
              disabled={updateTaskMutation.isPending}
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
              <Checkbox
                data-testid="task-checkbox"
                disabled={updateTaskMutation.isPending}
                checked={task.status === 'done'}
                onCheckedChange={(value) => toggleDone(value)}
              />
              <div>
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
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
                    disabled={mutationSubtasks.isPending}
                    onClick={() => handleGenerateSubtasks(task.id)}>
                    Gen subtask
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editTask(task.id)}>
                    Edit
                  </DropdownMenuItem>
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

      {task.subtasks && (
        <Subtasks task={task} />
      )}
      {(
        <AddTaskForm
          error={createTaskError}
          onAddTask={(values) => createTask({ ...values, parentTaskId: task.id })}
        />
      )}
      {generateSubtaskForTask && generateSubtaskForTask === task.id &&
        <>
          {mutationSubtasks.isPending && <p>generating subtasks</p>}
          {mutationSubtasks.isPending && <TasksSkeleton />}
          <DraftSubtasks task={task} />
        </>
      }
    </Card>
  );
}
