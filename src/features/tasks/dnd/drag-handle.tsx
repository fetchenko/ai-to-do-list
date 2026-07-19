'use client';

import {
  GripVertical,
} from 'lucide-react';

import type {
  DraggableAttributes,
} from '@dnd-kit/core';

import type {
  SyntheticListenerMap,
} from '@dnd-kit/core/dist/hooks/utilities';

type DragHandleProps = {
  attributes: DraggableAttributes;
  listeners?: SyntheticListenerMap;
};


export function DragHandle({
  attributes,
  listeners,
}: DragHandleProps) {
  return (
    <button
      type="button"
      className="
        px-3
        cursor-grab
        touch-none
        text-muted-foreground
      "
      aria-label="Drag task"
      {...listeners}
      {...attributes}
    >
      <GripVertical
        className="size-4"
        aria-hidden="true"
      />
    </button>
  );
}