import { ResetPasswordInput } from "@/components/auth/forgot-password-form";
import { LoginInput } from "@/components/auth/login-form";
import { SignupInput } from "@/components/auth/sign-up-form";
import { DEFAULT_REDIRECTS, ROUTES } from "@/lib/routes.config";
import { createClient } from "@/lib/supabase/client";

export async function signInWithPassword({ email, password }: LoginInput) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resetPasswordForEmail({ email }: ResetPasswordInput) {
  const supabase = createClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${ROUTES.authUpdatePassword}`,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUp({ email, password }: SignupInput) {
  const supabase = createClient();

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${DEFAULT_REDIRECTS.authenticated}`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}
