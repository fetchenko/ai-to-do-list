'use client';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/app/config/routes.config';
import { Button } from '@/components/ui/button';
import { createClient } from '@/infrastructure/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });

    queryClient.clear();

    router.refresh();
    router.push(ROUTES.authLogin);
  };

  return <Button onClick={logout}>Logout</Button>;
}
