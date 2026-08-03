import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { AppError, ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { retryDelay, shouldRetry } from '@/shared/react-query/ai-retry';

export function useSubtaskDrafts(taskId: string) {
  const [drafts, setDrafts] = useState<AiTask[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!taskId) {
        throw new ValidationRequestError('Missing task id');
      }
      return await generateSubtasks(taskId);
    },
    retry: shouldRetry,
    retryDelay,
    onSuccess: (data: AiTask[]) => {
      setDrafts(data);
      setError(null);
    },
    onError: (error: Error) => {
      setDrafts(null);
      setError(error);

      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';

      toast.info(message);
    },
  });

  const discard = () => {
    setDrafts(null);
    setError(null);
  };

  const generate = () => {
    mutation.mutate();
  };

  const retry = () => {
    setError(null);
    mutation.mutate();
  };

  return {
    drafts,
    error,
    isGenerating: mutation.isPending,
    generate,
    retry,
    discard,
  };
}
