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
import { useTaskStore } from '@/store/use-task-store';
import { Task } from '@/features/tasks/tasks.types';
import { Subtasks } from './subtasks';
import { useSubtaskStore } from '@/store/use-subtask-store';
import { useForm } from 'react-hook-form';
import { taskStatus } from '@/features/tasks/task.constants';
import { useUpdateTaskMutation } from '@/features/tasks/hooks/use-update-task';

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
  const activeParentTaskId = useSubtaskStore((state) => state.activeParentTaskId);
  const setActiveParentTaskId = useSubtaskStore((state) => state.setActiveParentTaskId);
  const setSubtasks = useSubtaskStore((state) => state.setSubtasks);

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
    mutationFn: async ({ id, title }: Partial<Task>) => generateSubtasks({ id, title }),
    onSuccess: (data: Task[]) => {
      setSubtasks(data);
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
      onSuccess: () => { }
    })
  }

  const toggleDone = (id: string) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      updates: {
        status: taskStatus.done
      },
    }, { onSuccess: () => { } })
  };

  const handleDeleteTask = (id: string) => {
    mutationDelete.mutate(id);
  };

  const handleGenerateSubtasks = (task: Task) => {
    setActiveParentTaskId(task.id);
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
                onCheckedChange={() => toggleDone(task.id)}
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
                  <DropdownMenuItem onClick={() => handleGenerateSubtasks(task)}>
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
    </Card>
  );
}
