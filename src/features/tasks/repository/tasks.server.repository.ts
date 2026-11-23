import 'server-only';

import type { PostgrestError } from '@supabase/supabase-js';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import { fromSupabaseError } from '@/shared/errors/from-supabase-error';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  try {
    return await fetchTasks(supabase);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw fromSupabaseError(error as PostgrestError);
    }

    throw error;
  }
}
