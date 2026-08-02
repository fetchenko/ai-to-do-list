import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { AppError } from '@/shared/errors/app-error';
import { ErrorCode } from '@/shared/errors/code';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { ErrorHttpStatus } from '@/shared/errors/http-status-map';
import { retryDelay, shouldRetry } from '@/shared/react-query/ai-retry';

export function useSubtaskDrafts(taskId: string) {
  const [drafts, setDrafts] = useState<AiTask[] | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!taskId) {
        throw new AppError(
          ErrorCode.INVALID_REQUEST,
          ErrorHttpStatus[ErrorCode.INVALID_REQUEST],
          'Missing task id'
        );
      }
      return await generateSubtasks(taskId);
    },
    retry: shouldRetry,
    retryDelay,
    onSuccess: (data: AiTask[]) => {
      setDrafts(data);
    },
    onError: (error) => {
      setDrafts(null);

      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';

      toast.info(message);
    },
  });

  const discard = () => setDrafts(null);

  return {
    drafts,
    isPending: mutation.isPending,
    isError: mutation.isError,
    generate: mutation.mutate,
    discard,
  };
}
