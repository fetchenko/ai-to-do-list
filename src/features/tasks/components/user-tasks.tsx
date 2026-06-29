'use client';

import { useQuery } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import TaskItem from '@/features/tasks/components/task-item';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { taskKeys } from '@/features/tasks/constants/task.constants';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { getUserTasks } from '@/features/tasks/services/tasks.service';
import { Task } from '@/features/tasks/types/tasks.types';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export default function UserTasks() {
  const {
    data: tasks = [],
    isPending,
    error,
  } = useQuery({
    queryKey: taskKeys.all,
    queryFn: getUserTasks,
  });
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const filtered = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex w-full flex-1 flex-col gap-6 px-4 sm:px-0">
      <div className="space-y-6">
        <div className="mx-auto max-w-3xl space-y-6 p-6 sm:p-0">
          <AddTaskForm error={createTaskError} onAddTask={createTask} />
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
            {error && <p>{getFriendlyErrorMessage(error)}</p>}
            {(['active', 'done'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-4 space-y-3">
                {isPending ? (
                  <TasksSkeleton />
                ) : filtered(tab).length ? (
                  filtered(tab).map((task) => <TaskItem key={task.id} task={task} />)
                ) : (
                  <p>{`No ${tab} tasks yet`}</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
