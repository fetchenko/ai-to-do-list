import { Task } from "@/features/tasks/types/tasks.types";

export function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: "Test task",
    status: "active",
    position: "a0",
    userId: "user-1",
    priority: 1,
    completedAt: null,
    createdAt: null,
    deletedAt: null,
    description: null,
    dueDate: null,
    parentTaskId: null,
    updatedAt: null,
    subtasks: [],
    ...overrides,
  };
}
