import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  return fetchTasks(supabase);
}
