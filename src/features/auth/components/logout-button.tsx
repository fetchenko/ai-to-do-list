'use client';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { ROUTES } from '@/app/config/routes.config';
import { Button } from '@/components/ui/button';
import { logout } from '@/features/auth/repository/auth.repository';

export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const onLogout = async () => {
    await logout();

    queryClient.clear();

    router.refresh();
    router.push(ROUTES.authLogin);
  };

  return <Button onClick={onLogout}>Logout</Button>;
}
