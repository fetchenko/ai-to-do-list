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
import { signUp } from '@/features/auth/repository/auth.repository';
import { SignupInput, signupSchema } from '@/features/auth/schema/auth';

export function SignUpForm() {
  const {
    register,
    handleSubmit,
    formState: { errors: errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  const router = useRouter();

  const { mutate, error, isPending } = useMutation({
    mutationFn: signUp,
    onSuccess: () => {
      router.push(DEFAULT_REDIRECTS.authenticated);
    },
  });

  const onSumbit = (data: SignupInput) => {
    mutate(data);
  };

  return (
    <AuthCard title="Sign up" description="Create a new account">
      <form
        onSubmit={handleSubmit(onSumbit)}
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
              {...register('password')}
              placeholder="Password"
            />
          </FormField>
        </div>
        <div className="grid gap-2">
          <FormField
            idPrefix="confirm-password"
            label="Confirm Password"
            error={errors.password?.message}
          >
            <Input
              id="confirm-password"
              type="password"
              {...register('confirmPassword')}
              placeholder="Confirm password"
            />
          </FormField>
        </div>
        <Button
          type="submit"
          className="h-11 w-full sm:h-10"
          disabled={isPending}
        >
          {isPending ? 'Creating an account...' : 'Sign up'}
        </Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link
            href={ROUTES.authLogin}
            className="underline underline-offset-4"
          >
            Login
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
