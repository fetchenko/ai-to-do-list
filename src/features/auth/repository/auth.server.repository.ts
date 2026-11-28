import 'server-only';

import {
  createServerClient,
  type JwtPayload,
} from '@/infrastructure/supabase';
import { AuthorizationError } from '@/shared/errors/app-error';

export async function getCurrentUser() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AuthorizationError(error);
  }

  if (!user) {
    throw new AuthorizationError({
      message: 'No authenticated user was returned.',
    });
  }

  return { user };
}

export async function getUserClaims(): Promise<JwtPayload | undefined> {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();

  return data?.claims;
}
