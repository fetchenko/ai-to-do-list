import z from 'zod';

import {
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  updatePasswordSchema,
} from '@/features/auth/validation/auth';

export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
