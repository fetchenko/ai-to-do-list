'use client';

import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SortableItemProps = {
  id: string;
  disabled?: boolean;
  label?: string;
  children: ReactNode;
};

export function SortableItem({ id, disabled, label, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      aria-label={label}
      className={cn(
        'touch-none',
        isDragging && 'z-10 opacity-70',
        !disabled && 'cursor-grab active:cursor-grabbing'
      )}
    >
      {children}
    </div>
  );
}