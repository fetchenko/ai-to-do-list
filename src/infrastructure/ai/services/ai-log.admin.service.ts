import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { mapAiGenerationMetadataToUpdate } from '@/infrastructure/ai/utils/map-ai-generation-usage';
import { supabaseAdmin } from '@/infrastructure/supabase/admin';

export type CreateAiLogInput = {
  userId: string;
  taskId: string;
  feature: string;
};

type CompleteAiLogInput = {
  id: string;
  metadata: AiGenerationMetadata;
};

type FailAiLogInput = {
  id: string;
  errorCode: string;
};

type CancelAiLogInput = {
  id: string;
  errorCode: string;
};

export async function createAiGenerationLog(
  input: CreateAiLogInput
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('ai_generations')
    .insert({
      user_id: input.userId,
      task_id: input.taskId,
      feature: input.feature,
      status: 'pending',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function completeAiGenerationLog(
  input: CompleteAiLogInput
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ai_generations')
    .update({
      status: 'success',
      finished_at: new Date().toISOString(),
      ...mapAiGenerationMetadataToUpdate(input.metadata),
    })
    .eq('id', input.id)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
}

export async function failAiGenerationLog(
  input: FailAiLogInput
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ai_generations')
    .update({
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_code: input.errorCode,
    })
    .eq('id', input.id)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
}

export async function cancelAiGenerationLog(
  input: CancelAiLogInput
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ai_generations')
    .update({
      status: 'cancelled',
      finished_at: new Date().toISOString(),
      error_code: input.errorCode,
    })
    .eq('id', input.id)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }
}
