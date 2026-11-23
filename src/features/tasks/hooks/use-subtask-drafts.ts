import { useCallback, useEffect, useRef } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { ClientError } from '@/client/errors/client-error';
import { getFriendlyErrorMessage } from '@/client/errors/error-messages';
import { parseApiEventError } from '@/client/errors/parse-api-event-error';
import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiGeneratedTask } from '@/features/tasks/types/tasks.types';
import { ErrorCode } from '@/shared/errors/code';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';

export function useSubtaskDrafts(
  taskId: string,
  onSubtask: (draftSubtask: AiGeneratedTask) => void
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  const { error, isPending, mutate, reset } = useMutation({
    mutationFn: async (signal: AbortSignal) => {
      if (!taskId) {
        throw new ClientError(ErrorCode.INVALID_REQUEST);
      }

      for await (const chunk of streamSubtasks(taskId, signal)) {
        switch (chunk.type) {
          case 'event':
            onSubtask({ ...chunk.data, id: crypto.randomUUID() });
            break;
          case 'done':
            break;
          case 'cancelled':
          case 'error':
            throw parseApiEventError(chunk.error);
        }
      }
    },
    retry: false,
    onError: (error: Error) => {
      if (isAbortError(error)) return;

      const message = getFriendlyErrorMessage(error);
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
