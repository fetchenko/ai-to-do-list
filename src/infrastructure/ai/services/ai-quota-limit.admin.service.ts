import { supabaseAdmin } from '@/infrastructure/supabase/admin';
import { AiRequestLimitError } from '@/shared/errors/app-error';

export async function checkAiQuotaLimit(userId: string, quotaLimit: number) {
  const { count } = await supabaseAdmin
    .from('ai_generations')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .eq('user_id', userId)
    .eq('feature', 'generate-subtasks')
    .eq('status', 'success');

  if ((count ?? 0) >= quotaLimit) {
    throw new AiRequestLimitError(
      `Reached maximum AI requests per user (${quotaLimit})`
    );
  }
}
