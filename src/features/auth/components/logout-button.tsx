"use client";

import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/app/config/routes.config";
import { useQueryClient } from '@tanstack/react-query';

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
