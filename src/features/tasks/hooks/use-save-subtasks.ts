import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/task.constants';
import { saveSubtasks } from '@/features/tasks/services/subtasks.service';
import { TaskInsert } from '@/features/tasks/types/tasks.types';
import { AppError } from '@/shared/errors/app-error';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useSaveSubtasks(parentTaskId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (subtasks: TaskInsert[]) =>
      saveSubtasks(parentTaskId, subtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      const message =
        error instanceof AppError
          ? getFriendlyErrorMessage(error)
          : 'Some subtasks could not be saved. Try again.';
      toast.info(message);
    },
  });

  return {
    saveSubtasks: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
