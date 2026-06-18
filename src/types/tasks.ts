import z from "zod";

import { SubtasksResponseSchema } from "@/lib/validation/task";
import { Database, TaskStatus } from "@/types/supabase";

export type SubtasksResponse = z.infer<typeof SubtasksResponseSchema>;

export type DbTask = Database["public"]["Tables"]["tasks"]["Row"] & {
  subtasks?: DbTask[];
};

export type DbTaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

export type DbTaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type Task = {
  id: string;
  completedAt: string | null;
  createdAt: string | null;
  description: string | null;
  dueDate: string | null;
  parentTaskId: string | null;
  position: string;
  priority: number | null;
  status: TaskStatus;
  title: string | null;
  updatedAt: string | null;
  userId: string;
  subtasks?: Task[];
};

export type TaskUpdate = Partial<Omit<Task, "subtasks">>;
