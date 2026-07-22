import { Task } from '@/features/tasks/types/tasks.types';

export type Neighbors = {
  prev: string | null;
  next: string | null;
};

export type DndData =
  | {
      type: 'task';
      task: Task;
      subtasksCount?: number;
    }
  | {
      type: 'subtask';
      task: Task;
    }
  | {
      type: 'empty-subtasks';
      parentTaskId: string;
    }
  | {
      type: 'container';
    };

export type DndDataType = DndData['type'];
