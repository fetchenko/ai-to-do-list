'use client';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { DEFAULT_REDIRECTS } from '@/app/config/routes.config';
import { FormError } from '@/components/blocks/form-error';
import { FormField } from '@/components/primitives/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthCard } from '@/features/auth/components/auth-card';
import { updatePassword } from '@/features/auth/repository/auth.repository';
import {
  UpdatePasswordInput,
  updatePasswordSchema,
} from '@/features/auth/schema/auth';

export function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: 'onBlur',
  });
  const router = useRouter();

  const { mutate, error, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      router.push(DEFAULT_REDIRECTS.authenticated);
    },
  });

  const onSubmit = async (data: UpdatePasswordInput) => {
    mutate(data);
  };

  return (
    <AuthCard
      title="Reset Your Password"
      description="Please enter your new password below."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 sm:gap-6"
        noValidate
      >
        <FormError message={error?.message} />
        <div className="grid gap-2">
          <FormField
            idPrefix="password"
            label="New Password"
            error={errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              placeholder="New password"
              {...register('password')}
            />
          </FormField>
        </div>
        <div className="grid gap-2">
          <FormField
            idPrefix="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="confirmPassword"
              placeholder="Confirm password"
              {...register('confirmPassword')}
            />
          </FormField>
        </div>
        <Button
          type="submit"
          className="h-11 w-full sm:h-10"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save new password'}
        </Button>
      </form>
    </AuthCard>
  );
}
