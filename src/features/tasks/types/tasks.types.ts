import { TaskStatus } from '@/shared/types/database.types';

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
};

export type TaskInsert = Partial<Task> & Required<Pick<Task, 'title'>>;
export type TaskUpdate = Partial<Omit<Task, 'subtasks'>>;
export type AiTask = Partial<Task> & Required<Pick<Task, 'id' | 'title'>>;

export type TaskGroup = {
  parent: Task;
  subtasks: Task[];
};
