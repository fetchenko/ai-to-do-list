'use client';

import { memo } from 'react';

import { Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import EditTaskForm from '@/features/tasks/components/edit-task-form';
import SubtaskItem from '@/features/tasks/components/subtask-item';
import { TaskActionsMenu } from '@/features/tasks/components/task-action-menu';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { Task } from '@/features/tasks/types/tasks.types';
import { SortableItem } from '@/components/sortable/sortable-item';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useReorderTask } from '@/features/tasks/hooks/use-reorder-task';

type TaskItemProps = {
  task: Task;
  subtasks: Task[];
  className?: string;
};

function TaskItem({ task, subtasks, className }: TaskItemProps) {
  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);

  const { deleteWithUndo } = useDeleteTaskWithUndo();
  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const { drafts, generate, isPending, discard } = useSubtaskDrafts(task.id);

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

    const oldIndex = subtasks.findIndex((t) => t.id === active.id);
    const newIndex = subtasks.findIndex((t) => t.id === over.id);

    const reordered = arrayMove(subtasks, oldIndex, newIndex);

    const movedIndex = reordered.findIndex((t) => t.id === active.id);


    const beforeId = reordered[movedIndex - 1]?.id ?? null;
    const afterId = reordered[movedIndex + 1]?.id ?? null;

    reorderTask({
      taskId: active.id as string,
      parentTaskId: task.id,
      beforeId,
      afterId,
    });
  };
  const isEditing = editingTaskId === task.id;
  const hasSubtasks = !!subtasks?.length;
  const showDraftPanel = isPending || drafts !== null;

  return (
    <Card
      data-testid="task-item"
      data-task-title={task.title}
      className={className}
    >
      <article
        aria-labelledby={`task-title-${task.id}`}
        className="space-y-3 p-4"
      >
        {isEditing ? (
          <EditTaskForm task={task} />
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <TaskCheckbox
                task={task}
                aria-label={`Mark "${task.title}" complete`}
              />
              <div className="min-w-0">
                <p
                  id={`task-title-${task.id}`}
                  className="font-medium break-words"
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-muted-foreground text-sm break-words">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <TaskActionsMenu
              showGenerate
              onGenerateSubtasks={() => generate()}
              onEdit={() => setEditingTaskId(task.id)}
              onDelete={() => deleteWithUndo(task)}
            />
          </div>
        )}

        {hasSubtasks && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subtasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2" aria-label={`Subtasks for ${task.title}`}>
                {subtasks.map((subtask) => (
                  <li key={subtask.id}>
                    <SortableItem
                      id={subtask.id}
                      disabled={editingTaskId === subtask.id}
                    >
                      <SubtaskItem task={subtask} />
                    </SortableItem>
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        {showDraftPanel && (
          <div aria-live="polite" className="space-y-2">
            {isPending ? (
              <>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
                  Generating subtasks…
                </p>
                <TasksSkeleton />
              </>
            ) : (
              <DraftSubtasks
                task={task}
                drafts={drafts ?? []}
                onDiscard={discard}
              />
            )}
          </div>
        )}

        <AddTaskForm
          error={createTaskError}
          onAddTask={(values) =>
            createTask({ ...values, parentTaskId: task.id })
          }
        />
      </article>
    </Card>
  );
}

export default memo(TaskItem);

