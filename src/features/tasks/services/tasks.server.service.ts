import { fetchTasksServer } from '@/features/tasks/repository/tasks.server.repository';
import { filterDeletedSubtasks } from '@/features/tasks/utils/tasks-helpers';

export async function getUserTasksServer() {
  const tasks = await fetchTasksServer();

  return filterDeletedSubtasks(tasks);
}
