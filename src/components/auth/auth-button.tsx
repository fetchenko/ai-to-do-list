import Link from "next/link";
import { Button } from "../ui/button";
import { LogoutButton } from "./logout-button";
import { ROUTES } from '@/lib/routes.config'
import { getUserClaims } from "@/lib/supabase/services/user";

export async function AuthButton() {
  const user = await getUserClaims();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href={ROUTES.authLogin}>Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href={ROUTES.authSignup}>Sign up</Link>
      </Button>
    </div >
  );
}
