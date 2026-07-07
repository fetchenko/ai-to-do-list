import TaskItem from '@/features/tasks/components/task-item';
import { useReorderTask } from '@/features/tasks/hooks/use-reorder-task';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableItem } from '@/components/sortable/sortable-item';
import { TaskGroup } from '@/features/tasks/types/tasks.types';

interface TaskListProps {
  groups: TaskGroup[];
  emptyLabel: string;
}

export function TaskList({ groups, emptyLabel }: TaskListProps) {
  const { reorderTask } = useReorderTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groups.findIndex((t) => t.parent.id === active.id);
    const newIndex = groups.findIndex((t) => t.parent.id === over.id);
    const movingDown = newIndex > oldIndex;

    reorderTask({
      taskId: active.id as string,
      parentTaskId: null,
      beforeId: movingDown ? groups[newIndex].parent.id : groups[newIndex - 1]?.parent.id ?? null,
      afterId: movingDown ? groups[newIndex + 1]?.parent.id ?? null : groups[newIndex].parent.id,
    });
  };

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


  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={groups.map((t) => t.parent.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="space-y-3" aria-label="Tasks">
          {groups.map(({ parent, subtasks }) => (
            <li key={parent.id}>
              <SortableItem id={parent.id}>
                <TaskItem task={parent} subtasks={subtasks} />
              </SortableItem>
            </li>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
