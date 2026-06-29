import { z } from 'zod';

const email = z.string().email('Invalid email address');

const password = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100)
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');

export const loginSchema = z.object({
  email,
  password,
});

export const signupSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z.object({
  email,
});

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
