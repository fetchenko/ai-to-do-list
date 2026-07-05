import { getUserClaims } from '@/features/auth/repository/auth.server.repository';
import Hero from '@/features/home/components/hero';
import UserTasks from '@/features/tasks/components/user-tasks';
import { taskKeys } from '@/features/tasks/constants/task.constants';
import { getUserTasks } from '@/features/tasks/services/tasks.service';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function UserContent() {
  const user = await getUserClaims();

  if (!user) {
    return <Hero />;
  }

  const queryClient = new QueryClient();


  await queryClient.prefetchQuery({
    queryKey: taskKeys.all,
    queryFn: getUserTasks,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserTasks />
    </HydrationBoundary>
  );

}
