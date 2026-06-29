import z from 'zod';

import { deepSeekResponseSchema } from '@/infrastructure/ai/providers/deepseek/deepseek.validation';

export type DeepSeekResponse = z.infer<typeof deepSeekResponseSchema>;
