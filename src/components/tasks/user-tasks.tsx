'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AddTask } from '@/components/tasks/add-task';
import { useQuery } from '@tanstack/react-query';
import { getTasksWithSubtasks } from '@/features/tasks/tasks.api';
import { Task } from '@/types/tasks';
import TaskItem from './task-item';
import TasksSkeleton from './tasks-skeleton';

export default function UserTasks() {
  const { data: tasks = [], isPending, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasksWithSubtasks,
  })

  const filtered = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 w-full">
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <AddTask />
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
            </TabsList>
            {error && <p>Failed to load tasks</p>}
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

