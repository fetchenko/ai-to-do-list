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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTask, generateSubtasks } from '@/features/tasks/tasks.api';
import { useTaskStore } from '@/stores/use-task-store';
import { Task } from '@/features/tasks/tasks.types';
import { Subtasks } from './subtasks';
import { useSubtaskStore } from '@/stores/use-subtask-store';
import { useForm } from 'react-hook-form';
import { taskStatus } from '@/features/tasks/task.constants';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';
import { DraftSubtasks } from './draft-subtasks';
import { CheckedState } from '@radix-ui/react-checkbox';
import { AddTask } from './add-task';
import DraftSubtasksSkeleton from './draft-subtasks-skeleton';

type TaskItemProps = {
  task: Task;
}
type EditTaskForm = {
  title: string | null;
}

export default function TaskItem({ task }: TaskItemProps) {
  const updateTaskMutation = useUpdateTaskMutation()

  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const setGeneratedSubtasks = useSubtaskStore((state) => state.setGeneratedSubtasks);
  const generateSubtaskForTask = useSubtaskStore(state => state.generateSubtaskForTask);

  const queryClient = useQueryClient();

  const mutationDelete = useMutation({
    mutationFn: async (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
    },
  });

  const mutationSubtasks = useMutation({
    mutationFn: async ({ id }: Partial<Task>) => {
      if (id) {
        return await generateSubtasks({ id });
      }
      return null;
    },
    onSuccess: (data: Task[]) => {
      setGeneratedSubtasks(task.id, data);
    },
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

  const handleDeleteTask = (id: string) => {
    mutationDelete.mutate(id);
  };

  const handleGenerateSubtasks = (task: Task) => {
    mutationSubtasks.mutate({ id: task.id, title: task.title })
  };

  const editTask = (id: string) => {
    setEditingTaskId(id);
  };

  return (
    <Card key={task.id} className="p-4 space-y-3">
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
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={mutationSubtasks.isPending}
                    onClick={() => handleGenerateSubtasks(task)}>
                    Gen subtask
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editTask(task.id)}>
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteTask(task.id)}
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
        <AddTask isSubtask={true} parentTaskId={task.id} />
      )}
      {generateSubtaskForTask && generateSubtaskForTask === task.id &&
        <>
          {mutationSubtasks.isPending && <DraftSubtasksSkeleton />}
          <p>generated subtasks</p>
          <DraftSubtasks task={task} />
        </>
      }
    </Card>
  );
}
