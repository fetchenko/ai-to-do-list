import { Database, TaskStatus } from "@/shared/types/database.types";

export type DbTaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type DbTask = DbTaskRow & {
  subtasks?: DbTask[];
};

export type DbTaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type DbTaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskPreview = Pick<DbTask, "id" | "user_id" | "title">;

export type Task = {
  id: string;
  completedAt: string | null;
  createdAt: string | null;
  deletedAt: string | null;
  description: string | null;
  dueDate: string | null;
  parentTaskId: string | null;
  position: string;
  priority: number | null;
  status: TaskStatus;
  title: string;
  updatedAt: string | null;
  userId: string;
  subtasks?: Task[];
};

export type TaskInsert = Partial<Task> & Required<Pick<Task, "title">>;
export type TaskUpdate = Partial<Omit<Task, "subtasks">>;

export type AiTask = Partial<Task> & Required<Pick<Task, "id" | "title">>;
