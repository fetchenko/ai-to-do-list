import Hero from "@/components/tasks/hero";
import UserTasks from "@/components/tasks/user-tasks";
import { getUserClaims } from "@/lib/supabase/services/user";

export default async function UserContent() {
  const user = await getUserClaims();

  return user ? (
    <UserTasks user={user} />
  ) : (
    <Hero />
  );
}