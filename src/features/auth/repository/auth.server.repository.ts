import "server-only";

import { createClient as createServerClient } from "@/infrastructure/supabase/server";
import { AuthorizationError } from "@/shared/errors/app-error";

export async function getCurrentUser() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthorizationError({ error });
  }

  return { user };
}
