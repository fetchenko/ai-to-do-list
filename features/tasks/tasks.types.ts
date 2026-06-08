import { Database, TaskStatus } from "@/types/supabase";

export type DbTask = Database["public"]["Tables"]["tasks"]["Row"];

export type Task = {
  id: string;
  completedAt: string | null;
  createdAt: string | null;
  description: string | null;
  dueDate: string | null;
  parentTaskId: string | null;
  position: number;
  priority: number | null;
  status: TaskStatus;
  title: string | null;
  updatedAt: string | null;
  userId: string;
};
