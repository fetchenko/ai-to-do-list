'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { DEFAULT_REDIRECTS, ROUTES } from '@/app/config/routes.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/features/auth/repository/auth.repository';
import { SignupInput } from '@/features/auth/types/auth.types';
import { signupSchema } from '@/features/auth/validation/auth';

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
    mutationFn: async (data: SignupInput) => await signUp(data),
    onSuccess: () => {
      router.push(DEFAULT_REDIRECTS.authenticated);
    },
  });

  const onSumbit = (data: SignupInput) => {
    mutate(data);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>Create a new account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSumbit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} placeholder="Email" />
                {errors.email && <p className="text-red-500">{errors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Password"
                />
                {errors.password && <p className="text-red-500">{errors.password.message}</p>}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="repeat-password">Repeat Password</Label>
                </div>
                <Input
                  id="repeat-password"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
              {error && error.message && <p className="text-sm text-red-500">{error.message}</p>}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating an account...' : 'Sign up'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <Link href={ROUTES.authLogin} className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
