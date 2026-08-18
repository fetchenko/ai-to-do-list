import { supabaseAdmin } from '@/infrastructure/supabase/admin';
import {
  AiLockActiveError,
  AiLockRequestFailedError,
} from '@/shared/errors/app-error';

export async function checkRequestLock(userId: string) {
  const { data: lockAcquired, error } = await supabaseAdmin.rpc(
    'try_acquire_user_ai_lock',
    {
      p_user_id: userId,
    }
  );

  if (error) {
    throw new AiLockRequestFailedError(error);
  }

  if (!lockAcquired) {
    throw new AiLockActiveError(
      'Another AI generation is already running for this user'
    );
  }
}

export async function releaseRequestLock(userId?: string) {
  await supabaseAdmin.rpc('release_user_ai_lock', { p_user_id: userId });
}
