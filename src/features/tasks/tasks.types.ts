import { Database, TaskStatus } from "@/types/supabase";

export type DbTask = Database["public"]["Tables"]["tasks"]["Row"] & {
  subtasks?: DbTask[];
};

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
