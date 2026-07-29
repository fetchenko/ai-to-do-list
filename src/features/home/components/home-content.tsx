import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from '@tanstack/react-query';

import { getUserClaims } from '@/features/auth/repository/auth.server.repository';
import Hero from '@/features/home/components/hero';
import TasksManager from '@/features/tasks/components/tasks-manager';
import { taskKeys } from '@/features/tasks/constants/query-keys';
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
      <TasksManager />
    </HydrationBoundary>
  );
}
