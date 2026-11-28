import { JwtPayload } from '@supabase/supabase-js';
import 'server-only';

import { createClient as createServerClient } from '@/infrastructure/supabase/server';
import { parseAuthError } from '@/infrastructure/supabase/errors/auth/parse-auth-error';
import { AuthorizationError } from '@/shared/errors/app-error';

export async function getCurrentUser() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new AuthorizationError(parseAuthError(error));
  }

  if (!user) {
    throw new AuthorizationError({
      code: 'UNKNOWN',
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
