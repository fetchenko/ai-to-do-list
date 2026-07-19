import { Task, TaskGroup } from '@/features/tasks/types/tasks.types';
import { closestCorners, CollisionDetection, DndContext, DragEndEvent, DragStartEvent, KeyboardSensor, MeasuringStrategy, PointerSensor, pointerWithin, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react';
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useQueryClient } from '@tanstack/react-query';
import { taskKeys } from '@/features/tasks/constants/task.constants';
import { updateTaskInCache } from '@/features/tasks/utils/tasks-cache';
import { calculateTaskMove } from '@/features/tasks/utils/dnd/calculate-task-move';
import { calculateSubtaskMove } from '@/features/tasks/utils/dnd/calculate-subtask-move';
import { DndData } from '@/features/tasks/utils/dnd/types';
import { TaskNode } from '@/features/tasks/components/task-node';

interface TaskListProps {
  groups: TaskGroup[];
  emptyLabel: string;
  parentDragging?: boolean;
}

export type SubtaskMoveResult = {
  position: string;
  parentTaskId: string | null;
};

export function TaskList({ groups, emptyLabel }: TaskListProps) {
  const [overlayTask, setOverlayTask] = useState<DndData | null>(null);
  const queryClient = useQueryClient();

  const { setNodeRef } = useDroppable({
    id: 'root',
    data: {
      type: 'container',
    } satisfies DndData,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setOverlayTask(null);

    if (!event.over) return;

    const activeData = event.active.data.current as DndData;

    switch (activeData.type) {
      case "task": {
        const move = calculateTaskMove(groups, event);

        if (!move) return;

        queryClient.setQueryData(taskKeys.all, (old: Task[] = []) =>
          updateTaskInCache(old, event.active.id as string, {
            position: move.position,
          })
        );
        break;
      }

      case "subtask": {
        const move = calculateSubtaskMove(groups, event);

        if (!move) return;

        queryClient.setQueryData(taskKeys.all, (old: Task[] = []) =>
          updateTaskInCache(old, event.active.id as string, {
            position: move.position,
            parentTaskId: move.parentTaskId,
          })
        );
        break;
      }
    }
  };

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DndData;

    if (data.type === 'task' || data.type === 'subtask') {
      setOverlayTask(data);
    }

  }

  if (groups.length === 0) {
    return (
      <div
        role="status"
        className="text-muted-foreground flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed py-10 text-center text-sm"
      >
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const collisionDetection: CollisionDetection = (args) => {
    const pointer = pointerWithin(args);

    return pointer.length
      ? pointer
      : closestCorners(args);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <ul ref={setNodeRef} className="space-y-3" aria-label="Tasks">
        <SortableContext
          items={groups.map(g => g.parent.id)}
          strategy={verticalListSortingStrategy}
        >
          {groups.map(({ parent, subtasks }) => (
            <TaskNode
              activeType={overlayTask?.type}
              disabled={overlayTask?.type === 'subtask'}
              key={parent.id}
              task={parent}
              subtasks={subtasks}
            />
          ))}
        </SortableContext>
      </ul>
    </DndContext >
  );
}
