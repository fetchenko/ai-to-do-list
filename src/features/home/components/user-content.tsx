import { getUserClaims } from "@/features/auth/repository/auth.repository";
import Hero from "@/features/home/components/hero";
import UserTasks from "@/features/tasks/components/user-tasks";

export default async function UserContent() {
  const user = await getUserClaims();

  return user ? (
    <UserTasks />
  ) : (
    <Hero />
  );
}