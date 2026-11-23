import type { ErrorCode } from '@/shared/errors/code';

export type ApiEventError = {
  code: ErrorCode;
  message: string;
  status: number;
};

export type StreamEvent<T = unknown> =
  | { type: 'event'; data: T }
  | { type: 'done' }
  | { type: 'error'; error: ApiEventError }
  | { type: 'cancelled'; error: ApiEventError };
