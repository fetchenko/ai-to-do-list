import { DbTask, Task } from "./tasks.types";

export const mapTask = (dbTask: DbTask): Task => ({
  id: dbTask.id,
  completedAt: dbTask.completed_at,
  createdAt: dbTask.created_at,
  description: dbTask.description,
  dueDate: dbTask.due_date,
  parentTaskId: dbTask.parent_task_id,
  position: dbTask.position,
  priority: dbTask.priority,
  status: dbTask.status,
  title: dbTask.title,
  updatedAt: dbTask.updated_at,
  userId: dbTask.user_id,
});
