import { fetchTasksServer } from '@/features/tasks/repository/tasks.server.repository';
import { filterDeletedSubtasks } from '@/features/tasks/utils/tasks.utils';

export async function getUserTasksServer() {
  const tasks = await fetchTasksServer();

  return filterDeletedSubtasks(tasks);
}
