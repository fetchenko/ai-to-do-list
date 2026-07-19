import { neighborsAtIndex } from '@/features/tasks/utils/dnd/neighbors-at-index';

export function findInsertionNeighbors<
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
  const withoutActive = items.filter((i) => i.id !== activeId);

  const insertIndex = withoutActive.findIndex((i) => i.id === overId);

  const index = insertIndex === -1 ? withoutActive.length : insertIndex;

  return neighborsAtIndex(withoutActive, index);
}
