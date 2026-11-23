import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  return fetchTasks(supabase, fromSupabaseError);
}
