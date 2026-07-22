import { Task, } from '@/features/tasks/types/tasks.types';
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { Card } from '@/components/ui/card';
import { AddTaskForm } from '@/features/tasks/components/add-task-form';
import { DraftSubtasks } from '@/features/tasks/components/draft-subtasks';
import { useCreateTask } from '@/features/tasks/hooks/use-create-task';
import { useSubtaskDrafts } from '@/features/tasks/hooks/use-subtask-drafts';
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from '@/features/tasks/dnd/drag-handle';
import { TaskRow } from '@/features/tasks/components/task-row';
import { TaskCheckbox } from '@/features/tasks/components/task-checkbox';
import { TaskContent } from '@/features/tasks/components/task-content';
import EditTaskForm from '@/features/tasks/components/edit-task-form';
import { TaskActionsMenu } from '@/features/tasks/components/task-action-menu';
import { useTaskStore } from '@/features/tasks/stores/use-task-store';
import { useDeleteTaskWithUndo } from '@/features/tasks/hooks/use-delete-task-with-undo';
import { cn } from '@/lib/utils';
import { DndData, DndDataType } from '@/features/tasks/utils/dnd/types';

export type SortableTaskProps = {
  task: Task;
  subtasks?: Task[]
  children?: (props: {
    dragHandle: React.ReactNode;
  }) => React.ReactNode;
  activeType?: DndDataType,
  parentDragging?: boolean,
  disabled?: boolean
};


export function TaskNode({
  task,
  subtasks = [],
  parentDragging,
  disabled,
  activeType,
}: SortableTaskProps & {}) {
  const isParentTask = task.parentTaskId === null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: disabled,
    animateLayoutChanges: () => false,
    data: {
      type: isParentTask ? 'task' : 'subtask',
      task,
      subtasksCount: isParentTask ? subtasks.length : undefined,
    } satisfies DndData,
  });

  const { mutateAsync: createTask, error: createTaskError } = useCreateTask();

  const { drafts, generate, isPending, discard } = useSubtaskDrafts(task.id);

  const { setNodeRef: setNodeEmptyRef, isOver: isEmptyOver } = useDroppable({
    id: `empty:${task.id}`,
    disabled: parentDragging,
    data: {
      type: 'empty-subtasks',
      parentTaskId: task.id
    } satisfies DndData,
  });

  const editingTaskId = useTaskStore((state) => state.editingTaskId);
  const setEditingTaskId = useTaskStore((state) => state.setEditingTaskId);
  const { deleteWithUndo } = useDeleteTaskWithUndo();

  return (
    <li ref={setNodeRef}>
      <Card
        style={{
          transform: CSS.Transform.toString(transform),
          zIndex: isDragging ? 10 : undefined,
          position: isDragging ? "relative" : undefined,
          transition: isDragging ? undefined : transition,
        }}
        className={cn(
          isDragging ? 'opacity-60' : undefined,
          isParentTask ? 'p-4' : 'p-1'
        )}
      >
        <article
          aria-labelledby={`task-title-${task.id}`}
          className="flex space-y-3"
        >
          {editingTaskId && editingTaskId === task.id ?
            <TaskRow
              content={
                <EditTaskForm task={task} />
              }
            /> :
            <TaskRow
              leading={
                <>
                  <DragHandle
                    attributes={attributes}
                    listeners={listeners}
                  />
                  <TaskCheckbox task={task} aria-label={`Mark "${task.title}" complete`} />
                </>
              }
              content={
                <TaskContent task={task} />
              }
              trailing={
                <TaskActionsMenu
                  onEdit={() => setEditingTaskId(task.id)}
                  onDelete={() => deleteWithUndo(task)}
                  showGenerate={isParentTask}
                  onGenerateSubtasks={isParentTask ? () => generate() : undefined}
                />
              }
            />
          }
        </article>
        {isParentTask &&
          <>
            {(subtasks.length > 0)
              ? (
                <ul className="min-h-[2.5rem] space-y-2 p-4" aria-label={`Subtasks for ${task.title}`}>
                  <SortableContext
                    items={subtasks.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {subtasks.map((subtask) => (
                      <TaskNode
                        disabled={activeType === 'task'}
                        activeType={activeType}
                        key={subtask.id}
                        task={subtask}
                      />
                    ))}
                  </SortableContext>
                </ul>
              ) : (
                <div ref={setNodeEmptyRef} className="mt-2 border-l pl-3">
                  <div
                    className={`rounded-md border-2 border-dashed p-2 text-center text-[11px]
                    ${isEmptyOver ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-neutral-300 text-neutral-400"
                      }`}
                  >
                    Drop here to add as a subtask
                  </div>
                </div>
              )}
            <DraftSubtasks
              isLoading={isPending}
              task={task}
              drafts={drafts}
              onDiscard={discard}
            />
            <AddTaskForm
              error={createTaskError}
              onAddTask={(values) =>
                createTask({ ...values, parentTaskId: task.id })
              }
            />
          </>
        }
      </Card>
    </li>
  );
}
