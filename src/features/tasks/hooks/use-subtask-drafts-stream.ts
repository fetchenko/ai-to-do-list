import { useCallback, useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { AppError, ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useSubtaskDraftsStream(
  taskId: string,
  onSubtask: (draftSubtask: AiTask) => void
) {
  const [drafts, setDrafts] = useState<AiTask[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: async (signal: AbortSignal) => {
      if (!taskId) throw new ValidationRequestError('Missing task id');

      for await (const chunk of streamSubtasks(taskId, signal)) {
        switch (chunk.type) {
          case 'subtask': {
            const draft = { ...chunk.subtask, id: crypto.randomUUID() };
            onSubtask(draft);
            setDrafts((prev) => [...prev, draft]);
            break;
          }
          case 'done':
            break;
          case 'error': {
            const { error } = chunk;
            throw new AppError(error.code, error.status, error.message, error.details);
          }
        }
      }
    },
    retry: false,
    onError: (error: Error) => {
      if (isAbortError(error)) return;

      const message = error instanceof AppError
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
    setDrafts([]);
    mutation.reset();
  }, [cancel, mutation]);

  const generate = useCallback(() => {
    cancel();
    setDrafts([]);
    mutation.reset();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    mutation.mutate(controller.signal);
  }, [cancel, mutation]);

  const retry = useCallback(() => {
    cancel();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    mutation.mutate(controller.signal);
  }, [cancel, mutation]);

  useEffect(() => cancel, [cancel]);

  return {
    drafts,
    error: mutation.error,
    isGenerating: mutation.isPending,
    generate,
    retry,
    cancel,
    discard,
    isComplete: mutation.isSuccess,
  };
}
