import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log-resource';
import {
  AiGenerationCancelReason,
  AiGenerationCompletion,
  AiGenerationFailure,
  AiGenerationStatus,
} from '@/infrastructure/ai/generations/ai-generation.types';
import { AiRequestLock } from '@/infrastructure/ai/generations/ai-request-lock';

export type AiGeneration = {
  readonly id: string | null;

  complete(input: AiGenerationCompletion): Promise<void>;

  fail(error: AiGenerationFailure): Promise<void>;

  cancel(reason: AiGenerationCancelReason): Promise<void>;
};

export class AiGenerationResource implements AiGeneration {
  private status: AiGenerationStatus = 'pending';
  private cleanupPromise: Promise<void> | null = null;

  constructor(
    private readonly log: AiGenerationLog | null,
    private readonly lock: AiRequestLock
  ) {}

  get id(): string | null {
    return this.log?.id ?? null;
  }

  async complete(input: AiGenerationCompletion): Promise<void> {
    if (!this.transition('completed')) {
      return;
    }

    try {
      await this.tryLog(() => this.log?.complete(input));
    } finally {
      await this.cleanup();
    }
  }

  async fail(error: AiGenerationFailure): Promise<void> {
    if (!this.transition('failed')) {
      return;
    }

    try {
      await this.tryLog(() => this.log?.fail(error));
    } finally {
      await this.cleanup();
    }
  }

  async cancel(reason: AiGenerationCancelReason): Promise<void> {
    if (!this.transition('cancelled')) {
      return;
    }

    try {
      await this.tryLog(() => this.log?.cancel(reason));
    } finally {
      await this.cleanup();
    }
  }

  private transition(next: AiGenerationStatus): boolean {
    if (this.status !== 'pending') {
      return false;
    }

    this.status = next;
    return true;
  }

  private async tryLog(
    operation: () => Promise<void> | undefined
  ): Promise<void> {
    try {
      await operation();
    } catch (error) {
      console.error('Failed to persist AI generation log', error);
    }
  }

  private async cleanup(): Promise<void> {
    if (!this.cleanupPromise) {
      this.cleanupPromise = this.lock.release();
    }

    await this.cleanupPromise;
  }
}
