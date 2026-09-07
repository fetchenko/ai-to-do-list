import { Task } from '@/features/tasks/types/tasks.types';
import { DbTask } from '@/shared/types/database.types';

export function mapDbTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    completedAt: dbTask.completed_at,
    deletedAt: dbTask.deleted_at,
    createdAt: dbTask.created_at,
    description: dbTask.description,
    dueDate: dbTask.due_date,
    parentTaskId: dbTask.parent_task_id,
    position: dbTask.position,
    priority: dbTask.priority,
    status: dbTask.status as Task['status'],
    title: dbTask.title,
    updatedAt: dbTask.updated_at,
    userId: dbTask.user_id,
  };
}
