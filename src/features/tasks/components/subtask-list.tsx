import SubtaskItem from '@/features/tasks/components/subtask-item';
import { Task } from '@/features/tasks/types/tasks.types';

interface SubtaskListProps {
  subtasks: Task[];
  label: string;
}

export function SubtaskList({ label, subtasks }: SubtaskListProps) {

  if (subtasks?.length > 0) {
    return (
      <ul className="space-y-2" aria-label={label}>
        {subtasks!.map((subtask) => (
          <li key={subtask.id}>
            <SubtaskItem task={subtask} />
          </li>
        ))}
      </ul>
    )
  }

  return null;
}
