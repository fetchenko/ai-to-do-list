import Link from 'next/link';

import { ROUTES } from '@/app/config/routes.config';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { getUserClaims } from '@/features/auth/repository/auth.server.repository';

export async function AuthButton() {
  const user = await getUserClaims();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.email}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={'default'}>
        <Link href={ROUTES.authLogin}>Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={'outline'}>
        <Link href={ROUTES.authSignup}>Sign up</Link>
      </Button>
    </div>
  );
}
