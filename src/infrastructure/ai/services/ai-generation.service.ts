import { acquireAiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLogResource } from '@/infrastructure/ai/generations/ai-generation-log';
import { AiGenerationResource } from '@/infrastructure/ai/generations/ai-generation';
import { createAiGenerationLog } from '@/infrastructure/ai/services/ai-log.admin.service';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { AiTool } from '@/infrastructure/ai/types/ai-tool.types';

export async function streamAiGeneration(input: {
  userId: string;
  taskId: string;
  feature: string;
  prompt: string;
  tool: AiTool;
  provider: AIProvider;
  signal: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  const generationLock = await acquireAiRequestLock(input.userId);
  let generationLog = null;
  try {
    const generationId = await createAiGenerationLog({
      userId: input.userId,
      taskId: input.taskId,
      feature: input.feature,
    });
    generationLog = generationId ? new AiGenerationLogResource(generationId) : null;
  } catch (error) {
    console.error('Failed to create AI generation log', error);
  }
  return new AiGenerationResource({
    prompt: input.prompt,
    tool: input.tool,
    provider: input.provider,
    signal: input.signal,
    generationLog,
    generationLock,
  }).stream();
}
