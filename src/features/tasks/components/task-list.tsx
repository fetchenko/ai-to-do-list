import TaskItem from '@/features/tasks/components/task-item';
import TasksSkeleton from '@/features/tasks/components/tasks-skeleton';
import { TaskGroup } from '@/features/tasks/types/tasks.types';

interface TaskListProps {
  groups: TaskGroup[];
  emptyLabel: string;
  loading: boolean;
}

export function TaskList({ groups, emptyLabel, loading }: TaskListProps) {

  if (loading) {
    return <TasksSkeleton />
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

  return (
    <ul className="space-y-3" aria-label="Tasks">
      {groups.map(({ parent, subtasks }) => (
        <li key={parent.id}>
          <TaskItem task={parent} subtasks={subtasks} />
        </li>
      ))}
    </ul>
  );
}
