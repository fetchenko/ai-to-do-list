import type { AuthError } from '@supabase/supabase-js';

import { DEFAULT_REDIRECTS, ROUTES } from '@/app/config/routes.config';
import {
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  UpdatePasswordInput,
} from '@/features/auth/schema/auth';
import { createClient } from '@/infrastructure/supabase/client';
import { fromSupabaseAuthError } from '@/infrastructure/supabase/errors/from-supabase-auth-error';
import { fromUnknownError } from '@/infrastructure/supabase/errors/from-unknown-error';
import { ClientError } from '@/client/errors/client-error';

type AuthRequestResult<T> = {
  error: AuthError | null;
  data?: T;
};

function runAuthRequest<T>(
  request: () => Promise<{ data: T; error: AuthError | null }>
): Promise<T>;
function runAuthRequest(
  request: () => Promise<{ error: AuthError | null }>
): Promise<void>;
async function runAuthRequest<T>(
  request: () => Promise<AuthRequestResult<T>>
): Promise<T | void> {
  try {
    const { data, error } = await request();

    if (error) {
      const mapped = fromSupabaseAuthError(error);
      throw new ClientError(mapped.code, mapped.message, {
        status: mapped.status,
        cause: error,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ClientError) throw error;

    const mapped = fromUnknownError(error);
    throw new ClientError(mapped.code, mapped.message, {
      status: mapped.status,
      cause: error,
    });
  }
}

export async function signInWithPassword({ email, password }: LoginInput) {
  const supabase = createClient();

  return runAuthRequest(() =>
    supabase.auth.signInWithPassword({ email, password })
  );
}

export async function resetPasswordForEmail({ email }: ResetPasswordInput) {
  const supabase = createClient();

  return runAuthRequest(() =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${ROUTES.authUpdatePassword}`,
    })
  );
}

export async function signUp({ email, password }: SignupInput) {
  const supabase = createClient();

  return runAuthRequest(() =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${DEFAULT_REDIRECTS.authenticated}`,
      },
    })
  );
}

export async function updatePassword({ password }: UpdatePasswordInput) {
  const supabase = createClient();

  return runAuthRequest(() => supabase.auth.updateUser({ password }));
}

export async function logout() {
  const supabase = createClient();

  await runAuthRequest(() =>
    supabase.auth.signOut({
      scope: 'local',
    })
  );
}
