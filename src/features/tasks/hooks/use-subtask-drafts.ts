import { useCallback, useEffect, useRef } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiGeneratedTask } from '@/features/tasks/types/tasks.types';
import { ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';
import { parseApiEventError } from '@/shared/errors/utils/parse-api-event-error';

export function useSubtaskDrafts(
  taskId: string,
  onSubtask: (draftSubtask: AiGeneratedTask) => void
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { error, isPending, mutate, reset } = useMutation({
    mutationFn: async (signal: AbortSignal) => {
      if (!taskId) throw new ValidationRequestError('Missing task id');
      for await (const chunk of streamSubtasks(taskId, signal)) {
        switch (chunk.type) {
          case 'event': {
            const { data, description } = chunk.data;
            if (typeof data !== 'string' || typeof description !== 'string') {
              throw new Error('AI returned an invalid generated item');
            }
            onSubtask({
              id: crypto.randomUUID(),
              title: data,
              description,
            });
            break;
          }
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
      toast.info(getFriendlyErrorMessage(error));
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

  return { error, isGenerating: isPending, generate, retry, cancel, discard };
}
