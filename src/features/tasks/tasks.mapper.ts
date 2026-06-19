import { DbTask, DbTaskUpdate, Task, TaskUpdate } from "@/types/tasks";

export const taskKeyMap = {
  id: "id",
  completed_at: "completedAt",
  created_at: "createdAt",
  description: "description",
  due_date: "dueDate",
  parent_task_id: "parentTaskId",
  position: "position",
  priority: "priority",
  status: "status",
  title: "title",
  updated_at: "updatedAt",
  user_id: "userId",
} as const;

export const taskKeyMapReverse = Object.fromEntries(
  Object.entries(taskKeyMap).map(([db, fe]) => [fe, db]),
) as {
  [K in keyof typeof taskKeyMap as (typeof taskKeyMap)[K]]: K;
};

export function mapDbTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    completedAt: dbTask.completed_at,
    createdAt: dbTask.created_at,
    description: dbTask.description,
    dueDate: dbTask.due_date,
    parentTaskId: dbTask.parent_task_id,
    position: dbTask.position,
    priority: dbTask.priority,
    status: dbTask.status as Task["status"],
    title: dbTask.title,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
  };
}

export function mapDbTasks(dbTasks: DbTask[] | null): Task[] {
  return dbTasks
    ? dbTasks.map((dbTask) => ({
        ...mapDbTask(dbTask),
        subtasks: (dbTask.subtasks ?? []).map(mapDbTask),
      }))
    : [];
}

export function mapTaskToDb(task: TaskUpdate): DbTaskUpdate {
  const result: Record<string, unknown> = {};

  for (const [feKey, value] of Object.entries(task)) {
    const dbKey =
      taskKeyMapReverse[feKey as keyof typeof taskKeyMapReverse] ?? feKey;

    if (value !== undefined) {
      result[dbKey] = value;
    }
  }

  return result;
}
