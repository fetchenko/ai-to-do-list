import { AiGenerationItem } from '@/shared/types/ai-generation.types';
import { ApiEventError } from '@/shared/errors/api-error.schema';

/**
 * Generic HTTP streaming protocol consumed by the frontend.
 * Feature-specific meaning is assigned after the event reaches the feature.
 */
export type AiStreamClientEvent =
  | { type: 'event'; data: AiGenerationItem }
  | { type: 'done' }
  | { type: 'error' | 'cancelled'; error: ApiEventError };
