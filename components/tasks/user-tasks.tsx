'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTask } from '@/components/tasks/add-task';
import { EditTask } from '@/components/tasks/edit-task';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, deleteTask, generateSubtasks } from '@/features/tasks/tasks.api';
import { useTaskStore } from '@/store/use-task-store';
import { Task } from '@/features/tasks/tasks.types';
import { Subtasks } from './subtasks';
import { useSubtaskStore } from '@/store/use-subtask-store';

export default function UserTasks() {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const activeParentTaskId = useSubtaskStore((state) => state.activeParentTaskId);
  const setActiveParentTaskId = useSubtaskStore((state) => state.setActiveParentTaskId);
  const setSubtasks = useSubtaskStore((state) => state.setSubtasks);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
    },
  });

  const { data: tasks = [], isPending, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const mutationSubtasks = useMutation({
    mutationFn: async ({ id, title }: Partial<Task>) => generateSubtasks({ id, title }),
    onSuccess: (data: Task[]) => {
      setSubtasks(data);
    },
  });

  const toggleDone = (id: string) => { };

  const handleDeleteTask = (id: string) => {
    mutation.mutate(id);
  };

  const handleGenerateSubtasks = (task: Task) => {
    setActiveParentTaskId(task.id);
    mutationSubtasks.mutate({ id: task.id, title: task.title })
  };

  const editTask = (id: string) => {
    setEditingTaskId(id);
  };

  const filtered = (status: Task['status']) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex-1 flex flex-col gap-6 px-4 w-full">
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Card className="p-4 space-y-3">
            <AddTask />
          </Card>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            {(['active', 'done', 'archived'] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {filtered(tab).map((task) => (
                  <>                  <Card key={task.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 w-full">
                      {editingTaskId && task.id === editingTaskId ? (
                        <EditTask task={task} />
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Checkbox
                              disabled={mutation.isPending}
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
                                <DropdownMenuItem>Archieve</DropdownMenuItem>
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
                    {activeParentTaskId && task.id === activeParentTaskId ?
                      mutationSubtasks.isPending ? <p>loading</p> : <Subtasks task={task} /> : null}
                  </>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
