import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/task.constants';
import { addTask } from '@/features/tasks/services/tasks.service';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTask,

    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: taskKeys.all,
      });
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
