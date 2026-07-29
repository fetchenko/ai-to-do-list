import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { taskKeys } from '@/features/tasks/constants/query-keys';
import { addTask } from '@/features/tasks/services/tasks.service';
import { Task } from '@/features/tasks/types/tasks.types';
import { appendToCache } from '@/features/tasks/utils/tasks-cache';
import { getFriendlyErrorMessage } from '@/shared/errors/error-messages';

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTask,

    onSuccess(createdTask) {
      // The server returns the full created row (id, position, timestamps),
      // so we can append it directly instead of refetching every task.
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        old ? appendToCache(old, createdTask) : old
      );
    },
    onError: (error) => {
      toast.error(getFriendlyErrorMessage(error));
      // Nothing was written to the cache on failure, so there's nothing to
      // roll back — but the RPC-based position lookup means server state
      // could still have shifted under us; reconcile from source of truth.
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
