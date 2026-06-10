import { taskToDbFieldMap } from "./task.constants";
import {
  DbTask,
  Task,
  TaskWithSubtasks,
  TaskWithSubtasksDb,
} from "./tasks.types";

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
    status: dbTask.status,
    title: dbTask.title,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
  };
}

export function mapDbTasksWithSubtasks(
  dbTasks: TaskWithSubtasksDb[],
): TaskWithSubtasks[] {
  return dbTasks.map((dbTask) => ({
    ...mapDbTask(dbTask),
    subtasks: (dbTask.subtasks ?? []).map(mapDbTask),
  }));
}

export function mapTaskUpdateToDb(updates: Partial<Task>): Partial<DbTask> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = taskToDbFieldMap[key as keyof typeof taskToDbFieldMap] ?? key;

    result[dbKey] = value;
  }

  return result as Partial<DbTask>;
}
