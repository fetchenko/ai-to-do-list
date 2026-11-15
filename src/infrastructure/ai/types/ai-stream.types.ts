import { AiGenerationMetadata } from '@/infrastructure/ai/types/ai.types';
import { AiGenerationItem } from '@/shared/types/ai-generation.types';
import { ApiEventError } from '@/shared/errors/api-error.schema';

export type AiStreamEvent =
  | { type: 'event'; data: AiGenerationItem }
  | { type: 'done'; metadata: AiGenerationMetadata }
  | { type: 'error'; error: ApiEventError };
