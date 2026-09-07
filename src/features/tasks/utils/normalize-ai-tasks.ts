import { AiGeneratedTask } from '@/features/tasks/types/tasks.types';

export const normalizeAiTask = (task: AiGeneratedTask) => ({
  id: task.id,
  title: task.title ?? undefined,
  description: task.description ?? undefined,
});

export const normalizeAiTasks = (tasks: AiGeneratedTask[]) =>
  tasks.map(normalizeAiTask);
