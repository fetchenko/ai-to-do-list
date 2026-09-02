import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import {
  AiGenerationCancelReason,
  AiGenerationCompletion,
  AiGenerationFailure,
} from '@/infrastructure/ai/generations/ai-generation.types';
import {
  cancelAiGenerationLog,
  completeAiGenerationLog,
  failAiGenerationLog,
} from '@/infrastructure/ai/services/ai-log.admin.service';
import { AI_GENERATION_CANCEL_CODES } from '@/shared/errors/code';

export class AiGenerationLogResource implements AiGenerationLog {
  constructor(private readonly generationId: string) {}

  get id() {
    return this.generationId;
  }

  async complete(input: AiGenerationCompletion) {
    await completeAiGenerationLog({
      id: this.generationId,
      ...input,
    });
  }

  async fail(error: AiGenerationFailure) {
    await failAiGenerationLog({
      id: this.generationId,
      errorCode: error.code,
    });
  }

  async cancel(reason: AiGenerationCancelReason) {
    await cancelAiGenerationLog({
      id: this.generationId,
      errorCode: AI_GENERATION_CANCEL_CODES[reason],
    });
  }
}
