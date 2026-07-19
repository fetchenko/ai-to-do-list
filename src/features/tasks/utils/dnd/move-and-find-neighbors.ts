import { arrayMove } from '@dnd-kit/sortable';

export function moveAndFindNeighbors<
  T extends { id: string; position: string },
>({
  items,
  activeId,
  overId,
}: {
  items: T[];
  activeId: string;
  overId: string;
}) {
  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return;
  }

  const reordered = arrayMove(items, oldIndex, newIndex);

  const activeIndex = reordered.findIndex((i) => i.id === activeId);

  return {
    reordered,
    neighbors: {
      prev: reordered[activeIndex - 1]?.position ?? null,
      next: reordered[activeIndex + 1]?.position ?? null,
    },
  };
}
