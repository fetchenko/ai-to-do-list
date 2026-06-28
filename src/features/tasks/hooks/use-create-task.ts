import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '../constants/task.constants';
import { addTask } from '../services/tasks.service';

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
