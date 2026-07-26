import SubtaskItem from '@/features/tasks/components/subtask-item';
import { Task } from '@/features/tasks/types/tasks.types';

interface SubtaskListProps {
  subtasks: Task[];
  parentTitle: string;
}

export default function SubtaskList({ parentTitle, subtasks }: SubtaskListProps) {
  if (subtasks.length === 0) return null;

  return (
    <ul className="space-y-2" aria-label={`Subtasks for ${parentTitle}`}>
      {subtasks.map((subtask) => (
        <li key={subtask.id}>
          <SubtaskItem task={subtask} />
        </li>
      ))}
    </ul>
  )
}
