import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import type { AiGeneratedTask } from '@/features/tasks/types/tasks.types';
import { ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { isAbortError } from '@/shared/errors/utils/is-abort-error';
import { parseApiEventError } from '@/shared/errors/utils/parse-api-event-error';

export function useSubtaskDrafts(
  taskId: string,
  onSubtask: (draftSubtask: AiGeneratedTask) => void
) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  }, []);

  const run = useCallback(
    async (controller: AbortController) => {
      try {
        if (!taskId) {
          throw new ValidationRequestError('Missing task id');
        }

        for await (const chunk of streamSubtasks(taskId, controller.signal)) {
          if (controller.signal.aborted) return;

          switch (chunk.type) {
            case 'subtask':
              onSubtask({ ...chunk.subtask, id: crypto.randomUUID() });
              break;
            case 'done':
              break;
            case 'cancelled':
            case 'error':
              throw parseApiEventError(chunk.error);
          }
        }
      } catch (error) {
        if (isAbortError(error) || controller.signal.aborted) return;

        const streamError =
          error instanceof Error ? error : new Error(String(error));
        setError(streamError);
        toast.info(getFriendlyErrorMessage(streamError));
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsGenerating(false);
        }
      }
    },
    [onSubtask, taskId]
  );

  const generate = useCallback(() => {
    cancel();
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    void run(controller);
  }, [cancel, run]);

  const retry = useCallback(() => {
    cancel();
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    void run(controller);
  }, [cancel, run]);

  const discard = useCallback(() => {
    cancel();
    setError(null);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return {
    error,
    isGenerating,
    generate,
    retry,
    cancel,
    discard,
  };
}
