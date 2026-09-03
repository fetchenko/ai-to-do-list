import {
  AiGenerationLog,
  AiGenerationLogResource,
} from '@/infrastructure/ai/generations/ai-generation-log-resource';
import {
  CreateAiLogInput,
  createAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';

export async function tryCreateAiGenerationLog(
  input: CreateAiLogInput
): Promise<AiGenerationLog | null> {
  try {
    const generationId = await createAiGenerationLog(input);

    if (generationId) {
      return new AiGenerationLogResource(generationId);
    }

    return null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
    return null;
  }
}
