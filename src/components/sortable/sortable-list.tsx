'use client';

import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';

import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

type Props = {
  items: { id: string }[];
  children: React.ReactNode;
  onDragEnd: (activeId: string, overId: string) => void;
};

export function SortableList({ items, children, onDragEnd }: Props) {
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (!over) return;
        if (active.id === over.id) return;

        onDragEnd(String(active.id), String(over.id));
      }}
    >
      <SortableContext
        items={items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {children}
      </SortableContext>
    </DndContext>
  );
}