import { DragEndEvent } from '@dnd-kit/core';

import { TaskGroup } from '@/features/tasks/types/tasks.types';
import { findInsertionNeighbors } from '@/features/tasks/utils/dnd/find-insertion-neighbors';
import { generatePosition } from '@/features/tasks/utils/dnd/generate-position';
import { getTargetParentId } from '@/features/tasks/utils/dnd/get-target-parent-id';
import { DndData } from '@/features/tasks/utils/dnd/types';

export function calculateSubtaskMove(groups: TaskGroup[], event: DragEndEvent) {
  if (!event.over) return;

  const activeData = event.active.data.current as {
    parentTaskId: string | null;
  };

  const overData = event.over.data.current as DndData;

  const targetParentId = getTargetParentId(overData);

  if (!targetParentId) return;

  const group = groups.find((g) => g.parent.id === targetParentId);

  if (!group) return;

  const neighbors = findInsertionNeighbors({
    items: group.subtasks,
    activeId: String(event.active.id),
    overId: String(event.over.id),
  });

  return {
    position: generatePosition(neighbors),
    parentTaskId: targetParentId,
    changedParent: activeData.parentTaskId !== targetParentId,
  };
}
