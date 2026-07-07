import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';

import { getUserClaims } from '@/features/auth/repository/auth.server.repository';
import Hero from '@/features/home/components/hero';
import UserTasks from '@/features/tasks/components/user-tasks';
import { taskKeys } from '@/features/tasks/constants/task.constants';
import { fetchTasksServer } from '@/features/tasks/repository/tasks.server.repository';

export default async function HomeContent() {
  const user = await getUserClaims();

  if (!user) {
    return <Hero />;
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: taskKeys.all,
    queryFn: fetchTasksServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTasks />
    </HydrationBoundary>
  );
}
