import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createServerClient } from '@/infrastructure/supabase';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  return fetchTasks(supabase);
}
