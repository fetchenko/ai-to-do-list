'use client';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { ROUTES } from '@/app/config/routes.config';
import { FormError } from '@/components/blocks/form-error';
import { FormField } from '@/components/primitives/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthCard } from '@/features/auth/components/auth-card';
import { resetPasswordForEmail } from '@/features/auth/repository/auth.repository';
import {
  ResetPasswordInput,
  resetPasswordSchema,
} from '@/features/auth/schema/auth';

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
  });

  const { mutate, error, isPending } = useMutation({
    mutationFn: resetPasswordForEmail,
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    mutate(data);
  };

  if (isSubmitSuccessful) {
    return (
      <AuthCard
        title="Check Your Email"
        description="Password reset instructions sent"
      >
        <p className="text-muted-foreground text-sm">
          If you registered using your email and password, you will receive a
          password reset email.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Your Password"
      description="Type in your email and we'll send you a link to reset your password"
    >
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
            <Input type="email" {...register('email')} placeholder="Email" />
          </FormField>
        </div>
        <Button
          type="submit"
          className="h-11 w-full sm:h-10"
          disabled={isPending}
        >
          {isPending ? 'Sending...' : 'Send reset email'}
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
