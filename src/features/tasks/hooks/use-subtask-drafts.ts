import { useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { generateSubtasks } from '@/features/tasks/services/subtasks.service';
import { AiTask } from '@/features/tasks/types/tasks.types';
import { AppError, ValidationRequestError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { retryDelay, shouldRetry } from '@/shared/react-query/ai-retry';

export function useSubtaskDrafts(taskId: string) {
  const [drafts, setDrafts] = useState<AiTask[] | null>(null);
  const generationRef = useRef(0);

  const mutation = useMutation({
    mutationFn: async (generation: number) => {
      if (!taskId) throw new ValidationRequestError('Missing task id');

      return generateSubtasks(taskId, {
        onSubtask: (subtask) => {
          if (generation !== generationRef.current) return;
          setDrafts((current) => [...(current ?? []), subtask]);
        },
      });
    },
    retry: shouldRetry,
    retryDelay,
    onSuccess: (data: AiTask[], generation: number) => {
      if (generation === generationRef.current) setDrafts(data);
    },
    onError: (error: Error, generation: number) => {
      if (generation !== generationRef.current) return;
      setDrafts((current) => (current?.length ? current : null));

      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Something went wrong generating subtasks. Try again.';
      toast.info(message);
    },
  });

  const discard = () => {
    generationRef.current += 1;
    setDrafts(null);
    mutation.reset();
  };

  const generate = () => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    setDrafts(null);
    mutation.reset();
    mutation.mutate(generation);
  };

  return {
    drafts,
    error: mutation.error,
    isGenerating: mutation.isPending,
    generate,
    discard,
  };
}
