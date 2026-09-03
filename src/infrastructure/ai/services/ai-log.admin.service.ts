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
  response: string | null;
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
  try {
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
      console.error('Failed to create AI generation log', {
        userId: input.userId,
        taskId: input.taskId,
        error,
      });

      return null;
    }

    return data.id;
  } catch (err) {
    console.error('Failed to create AI generation log:', err);
    return null;
  }
}

export async function completeAiGenerationLog(
  input: CompleteAiLogInput
): Promise<void> {
  try {
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
      console.error('Failed to complete AI generation log', {
        generationId: input.id,
        error,
      });
    }
  } catch (err) {
    console.error('Failed to complete AI generation log:', err);
  }
}

export async function failAiGenerationLog(
  input: FailAiLogInput
): Promise<void> {
  try {
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
      console.error('Failed to mark AI generation as failed', {
        generationId: input.id,
        error,
      });
    }
  } catch (err) {
    console.error('Failed to mark AI generation as failed:', err);
  }
}

export async function cancelAiGenerationLog(
  input: CancelAiLogInput
): Promise<void> {
  try {
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
      console.error('Failed to mark AI generation as cancelled', {
        generationId: input.id,
        error,
      });
    }
  } catch (err) {
    console.error('Failed to mark AI generation as cancelled:', err);
  }
}
