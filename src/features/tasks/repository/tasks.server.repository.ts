import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import {
  fromSupabaseError,
  isPostgrestError,
} from '@/infrastructure/supabase/errors/from-supabase-error';
import { AppError } from '@/shared/errors/app-error';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  try {
    return await fetchTasks(supabase);
  } catch (error) {
    if (!isPostgrestError(error)) throw error;

    const mappedError = fromSupabaseError(error);
    throw new AppError(
      mappedError.code,
      ErrorHttpStatus[mappedError.code],
      mappedError.message,
      error
    );
  }
}
