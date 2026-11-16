import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { ApiEventError } from '@/shared/errors/api-error.schema';

export type AiStreamEvent =
  | { type: 'event'; data: unknown }
  | { type: 'done'; metadata: AiGenerationMetadata }
  | { type: 'error'; error: ApiEventError };
