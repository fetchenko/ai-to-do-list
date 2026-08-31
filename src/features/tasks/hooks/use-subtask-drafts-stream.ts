import { useCallback, useEffect, useRef } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { parseApiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { AppError, ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useSubtaskDraftsStream(
  taskId: string,
  onSubtask: (draftSubtask: AiTask) => void
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const { error, isPending, mutate, reset } = useMutation({
    mutationFn: async (signal: AbortSignal) => {
      if (!taskId) {
        throw new ValidationRequestError('Missing task id');
      }

      for await (const chunk of streamSubtasks(taskId, signal)) {
        switch (chunk.type) {
          case 'subtask':
            onSubtask({ ...chunk.subtask, id: crypto.randomUUID() });
            break;
          case 'done':
            break;
          case 'error':
            throw parseApiError(chunk.error);
        }
      }
    },
    retry: false,
    onError: (error: Error) => {
      if (isAbortError(error)) return;

      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';

      toast.info(message);
    },
  });

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  }, []);

  const discard = useCallback(() => {
    cancel();
    reset();
  }, [cancel, reset]);

  const generate = useCallback(() => {
    cancel();
    reset();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    mutate(controller.signal);
  }, [cancel, mutate, reset]);

  const retry = useCallback(() => {
    cancel();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    mutate(controller.signal);
  }, [cancel, mutate]);

  useEffect(() => cancel, [cancel]);

  return {
    error,
    isGenerating: isPending,
    generate,
    retry,
    cancel,
    discard,
  };
}
