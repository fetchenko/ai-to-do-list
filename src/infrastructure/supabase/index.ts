export { supabaseAdmin } from './admin';
export { createClient } from './client';
export { updateSession } from './proxy';
export { createClient as createServerClient } from './server';

export { parseAuthError, AuthErrorCode } from './errors/auth/parse-auth-error';
export type { ParsedAuthError } from './errors/auth/parse-auth-error';

export {
  parseDatabaseError,
  DatabaseErrorCode,
} from './errors/database/parse-database-error';
export type { ParsedDatabaseError } from './errors/database/parse-database-error';

export type {
  DbAiGenerationUpdate,
} from './types/database-ai.types';
export type {
  DbTask,
  DbTaskForSubtaskGeneration,
  DbTaskInsert,
  DbTaskRow,
  DbTaskUpdate,
} from './types/database-task.types';
export type { Database } from './types/database.types';
