import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

import { type EmailOtpType } from '@supabase/supabase-js';

import { ROUTES } from '@/app/config/routes.config';
import { fromSupabaseAuthError } from '@/infrastructure/supabase/errors/from-supabase-auth-error';
import { fromUnknownError } from '@/infrastructure/supabase/errors/from-unknown-error';
import { createClient } from '@/infrastructure/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();

    let authError;

    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      authError = error;
    } catch (error) {
      const mappedError = fromUnknownError(error);
      redirect(
        `${ROUTES.authError}?error=${encodeURIComponent(mappedError.message)}`
      );
    }

    if (!authError) {
      redirect(next);
    }

    const mappedError = fromSupabaseAuthError(authError);
    redirect(
      `${ROUTES.authError}?error=${encodeURIComponent(mappedError.message)}`
    );
  }

  // redirect the user to an error page with some instructions
  redirect(`${ROUTES.authError}?error=No token hash or type`);
}
