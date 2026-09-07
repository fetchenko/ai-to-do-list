import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/query-keys';
import { saveSubtasks } from '@/features/tasks/services/subtasks.service';
import { TaskInsert } from '@/features/tasks/types/tasks.types';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useAddSubtasks(parentTaskId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (subtasks: TaskInsert[]) =>
      saveSubtasks(parentTaskId, subtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      toast.info(getFriendlyErrorMessage(error));
    },
  });

  return {
    saveSubtasks: mutation.mutateAsync,
    isSaving: mutation.isPending,
  };
}
