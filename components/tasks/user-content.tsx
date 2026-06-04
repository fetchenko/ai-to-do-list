import Hero from "@/components/tasks/hero";
import UserTasks from "@/components/tasks/user-tasks";
import { getCachedUserClaims } from "@/lib/supabase/services/user";

export default async function UserContent() {
  const user = await getCachedUserClaims();

  return user ? (
    <UserTasks user={user} />
  ) : (
    <Hero />
  );
}