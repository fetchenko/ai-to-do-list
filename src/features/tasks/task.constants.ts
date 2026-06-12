import { TaskStatus } from "@/types/supabase";

export const taskStatus = {
  active: "active",
  done: "done",
  archived: "archived",
} as const satisfies Record<string, TaskStatus>;

export const taskToDbFieldMap = {
  completedAt: "completed_at",
  createdAt: "created_at",
  description: "description",
  dueDate: "due_date",
  parentTaskId: "parent_task_id",
  position: "position",
  priority: "priority",
  status: "status",
  title: "title",
  updatedAt: "updated_at",
  userId: "user_id",
} as const;
