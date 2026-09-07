import { supabaseAdmin } from '@/infrastructure/supabase/admin';
import { AiLockRequestFailedError } from '@/shared/errors/app-error';

export async function tryAcquireLock(userId: string) {
  const { data: lockAcquired, error } = await supabaseAdmin.rpc(
    'try_acquire_user_ai_lock',
    {
      p_user_id: userId,
    }
  );

  if (error) {
    throw new AiLockRequestFailedError(error);
  }

  return lockAcquired;
}

export async function releaseRequestLock(userId: string) {
  await supabaseAdmin.rpc('release_user_ai_lock', { p_user_id: userId });
}
