import { AiGenerationLogResource } from '@/infrastructure/ai/generations/ai-generation-log-resource';
import {
  AiGenerationCancelReason,
  AiGenerationCompletion,
  AiGenerationFailure,
} from '@/infrastructure/ai/generations/ai-generation.types';
import {
  CreateAiLogInput,
  createAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';

export type AiGenerationLog = {
  readonly id: string;

  complete(input: AiGenerationCompletion): Promise<void>;

  fail(error: AiGenerationFailure): Promise<void>;

  cancel(reason: AiGenerationCancelReason): Promise<void>;
};

export async function tryCreateAiGenerationLog(
  input: CreateAiLogInput
): Promise<AiGenerationLog | null> {
  try {
    const id = await createAiGenerationLog(input);
    if (id) {
      return new AiGenerationLogResource(id);
    }

    return null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
    return null;
  }
}
