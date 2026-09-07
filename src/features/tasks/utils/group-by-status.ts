import { Task, TaskGroup } from '@/features/tasks/types/tasks.types';
import { buildGroups } from '@/features/tasks/utils/build-groups';

export function groupTasksByStatus(tasks: Task[]) {
  const groups = buildGroups(tasks);
  const initial: Record<Task['status'], TaskGroup[]> = {
    active: [],
    done: [],
    archived: [],
  };

  return groups.reduce((acc, group) => {
    const bucket = acc[group.parent.status];
    if (bucket) bucket.push(group);

    return acc;
  }, initial);
}
