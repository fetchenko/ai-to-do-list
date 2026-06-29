import { supabaseAdmin } from '@/infrastructure/supabase/admin';
import {
  AiLockActiveError,
  AiLockRequestFailedError,
  AiRequestLimitError,
} from '@/shared/errors/app-error';
import { AiGeneration } from '@/shared/types/database.types';

const MAX_AI_REQUESTS_PER_USER = 10;

export async function updateAiLog(logId: string, updates: AiGeneration['Update']) {
  if (!logId) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('ai_generations')
      .update(updates)
      .eq('id', logId)
      .select('id')
      .single();
    if (error) {
      console.error('Failed to update ai_generations log:', error);
    }

    return data?.id ?? null;
  } catch (err) {
    console.error('Unexpected logging failure:', err);
    return null;
  }
}

export async function createAiLog(input: AiGeneration['Insert']): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ai_generations')
      .insert(input)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create ai_generations log:', error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error('Unexpected create log failure:', err);
    return null;
  }
}

export async function checkAiQuotaLimit(userId: string) {
  const { count } = await supabaseAdmin
    .from('ai_generations')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('user_id', userId)
    .eq('feature', 'generate-subtasks')
    .eq('status', 'success');

  if ((count ?? 0) >= MAX_AI_REQUESTS_PER_USER) {
    throw new AiRequestLimitError(
      `Reached maximum AI requests per user (${MAX_AI_REQUESTS_PER_USER}`
    );
  }
}

export async function checkRequestLock(userId: string) {
  const { data: lockAcquired, error } = await supabaseAdmin.rpc('try_acquire_user_ai_lock', {
    user_id: userId,
  });

  if (error) {
    throw new AiLockRequestFailedError(error);
  }

  if (!lockAcquired) {
    throw new AiLockActiveError('Another AI generation is already running for this user');
  }
}
