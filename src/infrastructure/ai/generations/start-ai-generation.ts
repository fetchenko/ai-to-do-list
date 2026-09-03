import {
  AiGeneration,
  AiGenerationResource,
} from '@/infrastructure/ai/generations/ai-generation';
import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-request-lock';
import { tryCreateAiGenerationLog } from '@/infrastructure/ai/generations/try-create-ai-generation-log';

export async function startAiGeneration(input: {
  userId: string;
  taskId: string;
  feature: string;
}): Promise<AiGeneration> {
  const lock = await acquireAiRequestLock(input.userId);

  try {
    const log = await tryCreateAiGenerationLog(input);

    return new AiGenerationResource(log, lock);
  } catch (error) {
    await lock.release();

    throw error;
  }
}
