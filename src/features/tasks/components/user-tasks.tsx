'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { ErrorAlert } from '@/components/primitives/error-alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { TaskList } from '@/features/tasks/components/task-list';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { taskKeys } from '@/features/tasks/constants/task.constants';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { getUserTasks } from '@/features/tasks/services/tasks.service';
import type { Task } from '@/features/tasks/types/tasks.types';
import { groupTasksByStatus } from '@/features/tasks/utils/tasks-helpers';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

const TABS = [
  { value: 'active', label: 'Active', emptyLabel: 'No active tasks yet' },
  { value: 'done', label: 'Done', emptyLabel: 'No completed tasks yet' },
] as const satisfies readonly {
  value: Task['status'];
  label: string;
  emptyLabel: string;
}[];

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

  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <AddTaskForm error={createTaskError} onAddTask={createTask} />

        {error ? (
          <ErrorAlert
            className="mt-4"
            message={getFriendlyErrorMessage(error)}
          />
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TABS.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-4 focus-visible:outline-none"
              >
                {isPending ? (
                  <TasksSkeleton />
                ) : (
                  <TaskList
                    tasks={tasksByStatus[tab.value]}
                    emptyLabel={tab.emptyLabel}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
