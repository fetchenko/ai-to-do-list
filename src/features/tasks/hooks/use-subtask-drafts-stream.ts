import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { AppError, ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useSubtaskDraftsStream(
  taskId: string,
  onSubtask: (draftSubtask: AiTask) => void
) {
  const [drafts, setDrafts] = useState<AiTask[]>([]);

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

            onSubtask(draft);
            setDrafts((prev) => [...(prev ?? []), draft]);
            break;

          case 'done':
            break;

          case 'error':
            const { error } = chunk;
            throw new AppError(
              error.code,
              error.status,
              error.message,
              error.details
            );
        }
      }
    },
    retry: false,
    onError: (error: Error) => {
      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';

      toast.info(message);
    },
  });

  const discard = () => {
    setDrafts([]);
    mutation.reset();
  };

  const generate = () => {
    setDrafts([]);

    mutation.reset();
    mutation.mutate();
  };

  const retry = () => {
    mutation.mutate();
  };

  return {
    drafts,
    error: mutation.error,
    isGenerating: mutation.isPending,
    generate,
    retry,
    discard,
    isComplete: mutation.isSuccess,
  };
}
