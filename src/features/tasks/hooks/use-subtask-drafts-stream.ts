import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import {
  AiGenerationError,
  AppError,
  ValidationRequestError,
} from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { retryDelay, shouldRetry } from '@/shared/react-query/ai-retry';

export function useSubtaskDraftsStream(taskId: string) {
  const [drafts, setDrafts] = useState<AiTask[] | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!taskId) {
        throw new ValidationRequestError('Missing task id');
      }

      for await (const chunk of streamSubtasks(taskId)) {
        switch (chunk.type) {
          case 'subtask':
            const draft = {
              ...chunk.subtask,
              id: crypto.randomUUID(),
            };

            setDrafts((prev) => [...(prev ?? []), draft]);
            break;

          case 'done':
            break;

          case 'error':
            throw new AiGenerationError(chunk.error);
        }
      }
    },
    retry: shouldRetry,
    retryDelay,
    onError: (error: Error) => {
      setDrafts(null);

      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';

      toast.info(message);
    },
  });

  const discard = () => {
    setDrafts(null);
    mutation.reset();
  };

  const generate = () => {
    setDrafts(null);

    mutation.reset();
    mutation.mutate();
  };

  return {
    drafts,
    error: mutation.error,
    isGenerating: mutation.isPending,
    generate,
    discard,
    isGenerated: mutation.isSuccess,
  };
}
