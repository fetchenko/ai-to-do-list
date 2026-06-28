import { TaskStatus } from '@/shared/types/database.types';

export const taskStatus = {
  active: 'active',
  done: 'done',
  archived: 'archived',
} as const satisfies Record<string, TaskStatus>;

export const taskToDbFieldMap = {
  completedAt: 'completed_at',
  createdAt: 'created_at',
  description: 'description',
  dueDate: 'due_date',
  parentTaskId: 'parent_task_id',
  position: 'position',
  priority: 'priority',
  status: 'status',
  title: 'title',
  updatedAt: 'updated_at',
  userId: 'user_id',
} as const;

export const taskKeys = {
  all: ['tasks'] as const,
  list: (parentTaskId?: string) => [...taskKeys.all, 'list', parentTaskId ?? 'root'] as const,
  detail: (taskId: string) => [...taskKeys.all, 'detail', taskId] as const,
};
