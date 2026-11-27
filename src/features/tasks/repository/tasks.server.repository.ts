import 'server-only';

import { fetchTasks } from '@/features/tasks/repository/tasks.repository';
import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import {
  fromSupabaseError,
  isPostgrestError,
} from '@/infrastructure/supabase/errors/from-supabase-error';
import { AppError } from '@/shared/errors/app-error';
import { fromUnknownError } from '@/infrastructure/supabase/errors/from-unknown-error';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';

export async function fetchTasksServer() {
  const supabase = await createServerClient();

  try {
    return await fetchTasks(supabase);
  } catch (error) {
    const mappedError = isPostgrestError(error)
      ? fromSupabaseError(error)
      : fromUnknownError(error);

    throw new AppError(
      mappedError.code,
      'status' in mappedError
        ? mappedError.status
        : ErrorHttpStatus[mappedError.code],
      mappedError.message,
      error
    );
  }
}
