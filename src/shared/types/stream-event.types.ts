import { ApiEventError } from '@/shared/errors/api-error.schema';

export type StreamEvent<T = unknown> =
  | { type: 'event'; data: T }
  | { type: 'done' }
  | { type: 'error'; error: ApiEventError }
  | { type: 'cancelled'; error: ApiEventError };
