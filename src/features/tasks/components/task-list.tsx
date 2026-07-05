import TaskItem from '@/features/tasks/components/task-item';
import type { Task } from '@/features/tasks/types/tasks.types';

interface TaskListProps {
  tasks: Task[];
  emptyLabel: string;
}

export function TaskList({ tasks, emptyLabel }: TaskListProps) {
  if (tasks.length === 0) {
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
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskItem task={task} />
        </li>
      ))}
    </ul>
  );
}
