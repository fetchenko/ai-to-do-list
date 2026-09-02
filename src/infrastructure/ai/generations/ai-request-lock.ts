import {
  releaseRequestLock,
  tryAcquireLock,
} from '@/infrastructure/ai/services/ai-lock.admin.service';
import { AiLockActiveError } from '@/shared/errors/app-error';

export type AiRequestLock = {
  release(): Promise<void>;
};

export async function acquireAiRequestLock(
  userId: string
): Promise<AiRequestLock> {
  const acquired = await tryAcquireLock(userId);

  if (!acquired) {
    throw new AiLockActiveError(
      'Another AI generation is already running for this user'
    );
  }

  let releasePromise: Promise<void> | undefined;

  return {
    release() {
      if (!releasePromise) {
        releasePromise = releaseRequestLock(userId);
      }

      return releasePromise;
    },
  };
}
