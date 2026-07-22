import { DndData } from '@/features/tasks/utils/dnd/types';

export function getTargetParentId(overData: DndData): string | null {
  switch (overData.type) {
    case 'subtask':
      return overData.task?.parentTaskId ?? null;

    case 'empty-subtasks':
      return overData.parentTaskId ?? null;

    case 'container':
    case 'task':
      return null;
  }
}
