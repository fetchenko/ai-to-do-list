import z from 'zod';

import { subtasksResponseSchema } from '@/shared/validation/subtasks.validation';

export type SubtasksResponse = z.infer<typeof subtasksResponseSchema>;
