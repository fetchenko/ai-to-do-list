import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import { AppError } from '@/shared/errors/app-error';
import { fromSupabaseError } from '@/infrastructure/supabase/errors/from-supabase-error';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  try {
    return await fetchTasks(supabase);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const mappedError = fromSupabaseError(error as never);
      throw new AppError(
        mappedError.code,
        ErrorHttpStatus[mappedError.code],
        mappedError.message,
        error
      );
    }

    throw error;
  }
}
