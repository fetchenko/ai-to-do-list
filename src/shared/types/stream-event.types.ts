import { ApiEventError } from '@/shared/errors/api-error.schema';

/**
 * Generic HTTP streaming protocol consumed by the frontend.
 * The event payload is intentionally independent of any feature model.
 */
export type AiStreamClientEvent =
  | { type: 'event'; data: Record<string, unknown> }
  | { type: 'done' }
  | { type: 'error' | 'cancelled'; error: ApiEventError };
