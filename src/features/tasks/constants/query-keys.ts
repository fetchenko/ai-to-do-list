/**
 * Query key factory for the `tasks` feature.
 *
 * The app currently fetches tasks as a single flat collection
 * (parent tasks + subtasks together, filtered/grouped client-side —
 * see `groupTasksByStatus` in tasks-manager.tsx), so there is only
 * one query variant: `taskKeys.all`.
 **/
export const taskKeys = {
  all: ['tasks'] as const,
};
