import { DragEndEvent } from '@dnd-kit/core';

import { TaskGroup } from '@/features/tasks/types/tasks.types';
import { generatePosition } from '@/features/tasks/utils/dnd/generate-position';
import { moveAndFindNeighbors } from '@/features/tasks/utils/dnd/move-and-find-neighbors';
import { byTaskPosition } from '@/features/tasks/utils/tasks.utils';

export function calculateTaskMove(groups: TaskGroup[], event: DragEndEvent) {
  if (!event.over) return;

  const sorted = [...groups]
    .sort((a, b) => byTaskPosition(a.parent, b.parent))
    .map((g) => ({
      id: g.parent.id,
      position: g.parent.position,
    }));

  const result = moveAndFindNeighbors({
    items: sorted,
    activeId: String(event.active.id),
    overId: String(event.over.id),
  });

  if (!result) return;

  return {
    position: generatePosition(result.neighbors),
  };
}
