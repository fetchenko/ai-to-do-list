"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InputTask } from "@/components/tasks/input-task";
import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/features/tasks/api";

type Subtask = {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
};

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: "active" | "done" | "archived";
  subtasks: Subtask[];
};

export default function UserTasks({ user }: { user: any }) {
  const [loadingSubtasksFor, setLoadingSubtasksFor] = useState<string | null>(null);


  const { data: tasks = [], isPending, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })

  const toggleDone = (id: string) => {};

  const deleteTask = (id: string) => {};

  const generateSubtasks = async (taskId: string) => {};

  const updateSubtask = (taskId: string, subId: string, patch: Partial<Subtask>) => {};

  const filtered = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status);


  return (
    <div className="flex-1 flex flex-col gap-6 px-4 w-full">
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Card className="p-4 space-y-3">
            <InputTask />
          </Card>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="done">Done</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>

            {(["active", "done", "archived"] as const).map((tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {filtered(tab).map((task) => (
                  <Card key={task.id} className="p-4 space-y-3">

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleDone(task.id)}
                        />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => generateSubtasks(task.id)}
                            >Gen subtask</DropdownMenuItem>
                            <DropdownMenuItem>Archieve</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteTask(task.id)}
                              className="text-red-500"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {task.subtasks?.length > 0 && (
                      <div className="pl-6 space-y-2">
                        <Separator />

                        {loadingSubtasksFor === task.id ? (
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                          </div>
                        ) : (
                          task.subtasks.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <Input
                                value={sub.title}
                                onChange={(e) =>
                                  updateSubtask(task.id, sub.id, {
                                    title: e.target.value,
                                  })
                                }
                                className="h-8"
                              />

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    updateSubtask(task.id, sub.id, {
                                      status: "approved",
                                    })
                                  }
                                >
                                  Approve
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateSubtask(task.id, sub.id, {
                                      status: "rejected",
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>


        </div>
      </div>
    </div>

  )
}