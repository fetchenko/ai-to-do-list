'use client';

import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';

import { ErrorAlert } from '@/components/primitives/error-alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { SearchTasksInput } from '@/features/tasks/components/search-tasks-input';
import { TaskList } from '@/features/tasks/components/task-list';
import { taskKeys } from '@/features/tasks/constants/query-keys';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { fetchTasksClient } from '@/features/tasks/repository/tasks.repository';
import { Task } from '@/features/tasks/types/tasks.types';
import { filterGroupsByQuery, groupTasksByStatus } from '@/features/tasks/utils/tasks.utils';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { testIds } from '@/shared/testing/test-ids';

const TABS = [
  { value: 'active', label: 'Active', emptyLabel: 'No active tasks yet' },
  { value: 'done', label: 'Done', emptyLabel: 'No completed tasks yet' },
] as const satisfies readonly {
  value: Task['status'];
  label: string;
  emptyLabel: string;
}[];

export default function TasksManager() {
  const {
    data: tasks = [],
    isPending,
    error,
  } = useQuery({
    queryKey: taskKeys.all,
    queryFn: fetchTasksClient,
  });

  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const [query, setQuery] = useState('');

  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks]);
  const filteredByStatus = useMemo(
    () => ({
      active: filterGroupsByQuery(tasksByStatus.active, query),
      done: filterGroupsByQuery(tasksByStatus.done, query),
    }),
    [tasksByStatus, query]
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        <div data-testid={testIds.taskSection.new}>
          <AddTaskForm
            error={createTaskError}
            onAddTask={createTask}
          />
        </div>

        <SearchTasksInput value={query} onChange={setQuery} />

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
                <TaskList
                  loading={isPending}
                  groups={filteredByStatus[tab.value]}
                  emptyLabel={query ? `No tasks match "${query}"` : tab.emptyLabel}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
