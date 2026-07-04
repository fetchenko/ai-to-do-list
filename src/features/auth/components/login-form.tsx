'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { DEFAULT_REDIRECTS, ROUTES } from '@/app/config/routes.config';
import { FormError } from '@/components/blocks/form-error';
import { FormField } from '@/components/primitives/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthCard } from '@/features/auth/components/auth-card';
import { signInWithPassword } from '@/features/auth/repository/auth.repository';
import { LoginInput, loginSchema } from '@/features/auth/schema/auth';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const router = useRouter();

  const { mutate, error, isPending } = useMutation({
    mutationFn: signInWithPassword,
    onSuccess: () => router.push(DEFAULT_REDIRECTS.authenticated),
  });

  const onSubmit = async (data: LoginInput) => {
    mutate(data);
  };

  return (
    <AuthCard title="Login" description="Enter your email below to login">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 sm:gap-6"
        noValidate
      >
        <FormError message={error?.message} />
        <div className="grid gap-2">
          <FormField
            idPrefix="email"
            label="Email"
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register('email')}
              placeholder="Email"
            />
          </FormField>
        </div>
        <div className="grid gap-2">
          <FormField
            idPrefix="password"
            label="Password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              {...register('password')}
            />
          </FormField>
          <div className="flex-end flex flex-wrap items-center gap-1">
            <Link
              href={ROUTES.authForgotPassword}
              className="text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          className="h-11 w-full sm:h-10"
          disabled={isPending}
        >
          {isPending ? 'Logging in...' : 'Login'}
        </Button>
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link
            href={ROUTES.authSignup}
            className="underline underline-offset-4"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
