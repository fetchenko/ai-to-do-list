'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@/features/tasks/types/tasks.types';
import TaskItem from './task-item';
import TasksSkeleton from './tasks-skeleton';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { AddTask } from './add-task';
import { taskKeys } from '../constants/task.constants';
import { getUserTasks } from '../services/tasks.service';

export default function UserTasks() {
  const { data: tasks = [], isPending, error } = useQuery({
    queryKey: taskKeys.all,
    queryFn: getUserTasks,
  })

  const filtered = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 w-full sm:px-0">
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto p-6 space-y-6 sm:p-0">
          <AddTask />
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
            {error && <p>{getFriendlyErrorMessage(error)}</p>}
            {(['active', 'done'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {isPending
                  ? <TasksSkeleton />
                  : filtered(tab).length ? filtered(tab).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))
                    : <p>{`No ${tab} tasks yet`}</p>
                }
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

