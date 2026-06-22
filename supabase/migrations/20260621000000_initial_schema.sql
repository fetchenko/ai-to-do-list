-- ============================================================================
-- Initial schema for ai-to-do-list
--
-- Reconstructed from src/shared/types/database.types.ts and the queries in
-- the codebase (tasks.repository.ts, ai.helpers.ts, ai-logs/*).
--
-- CONFIDENCE LEVELS:
--   - Table columns, types, nullability, FKs  -> HIGH (taken directly from
--     the generated TypeScript types)
--   - Column defaults                          -> MEDIUM (inferred from
--     which fields are optional in `Insert`)
--   - RLS policies                              -> MEDIUM (inferred from
--     which Supabase client - admin vs RLS-bound - each query uses)
--   - The two function BODIES                   -> LOW / BEST-EFFORT.
--     Only the signatures are known. Treat these as a plausible
--     reimplementation, not a guaranteed match. Run `supabase db pull`
--     against your live project and diff it against this file to confirm
--     or replace the function bodies below.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enum
-- ---------------------------------------------------------------------------
create type public.task_status as enum ('active', 'done', 'archived');

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  parent_task_id  uuid references public.tasks (id) on delete cascade,
  title           text,
  description     text,
  status          public.task_status not null default 'active',
  priority        integer,
  due_date        timestamptz,
  position        text not null default '',
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_parent_task_id_idx on public.tasks (parent_task_id);
-- Speeds up ORDER BY position used when listing tasks/subtasks.
create index tasks_position_idx on public.tasks (parent_task_id, position);

alter table public.tasks enable row level security;

-- Owner-only access: every feature query filters by user_id, so RLS should
-- enforce the same boundary at the database level.
create policy "Users can select own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Keep updated_at current on every write.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
create table public.ai_generations (
  id                      uuid primary key default gen_random_uuid(),
  task_id                 uuid not null references public.tasks (id) on delete cascade,
  user_id                 uuid references auth.users (id) on delete set null,
  feature                 text,
  status                  text,
  model                   text,
  prompt                  text,
  prompt_version          text,
  response                text,
  error_code              text,
  finish_reason           text,
  provider_generation_id  text,
  input_tokens            integer,
  output_tokens           integer,
  total_tokens            integer,
  cache_hit_tokens        integer,
  cache_miss_tokens       integer,
  reasoning_tokens        integer,
  duration_ms             integer,
  started_at              timestamptz,
  finished_at             timestamptz
);

create index ai_generations_task_id_idx on public.ai_generations (task_id);
create index ai_generations_user_id_idx on public.ai_generations (user_id);
-- Used by checkAiQuotaLimit and (in the inferred lock design below) by
-- try_acquire_user_ai_lock to find a user's in-flight/successful requests.
create index ai_generations_user_status_idx
  on public.ai_generations (user_id, feature, status);

alter table public.ai_generations enable row level security;

-- Reads happen through the RLS-bound server client (checkAiQuotaLimit), so
-- owners need SELECT. Writes happen exclusively through the service-role
-- admin client (createAiLog / updateAiLog), which bypasses RLS entirely --
-- so no INSERT/UPDATE policy is granted to regular users on purpose.
create policy "Users can select own ai_generations"
  on public.ai_generations for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- RPC functions
-- ---------------------------------------------------------------------------

-- get_last_position
-- Confidence: medium-high. Straightforward read matching how it's called
-- from tasks.repository.ts / tasks.service.ts (client-side, RLS-bound),
-- so it runs as SECURITY INVOKER and relies on the SELECT policy above to
-- scope results to the caller's own tasks.
create or replace function public.get_last_position(p_parent_id uuid default null)
returns text
language sql
stable
security invoker
as $$
  select position
  from public.tasks
  where (p_parent_id is null and parent_task_id is null)
     or parent_task_id = p_parent_id
  order by position desc
  limit 1;
$$;

-- try_acquire_user_ai_lock
-- Confidence: LOW -- best-effort reconstruction.
-- No dedicated lock table exists in database.types.ts, so this implements
-- the lock as "is there already a pending AI generation for this user?".
-- The lock self-releases the moment updateAiLog() flips that row's status
-- away from 'pending' -- which matches the app code never calling an
-- explicit "release" function. Uses SECURITY DEFINER so it can see all
-- pending rows regardless of the caller's RLS-scoped SELECT policy.
create or replace function public.try_acquire_user_ai_lock(user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  has_pending boolean;
begin
  select exists (
    select 1
    from public.ai_generations
    where ai_generations.user_id = try_acquire_user_ai_lock.user_id
      and status = 'pending'
  ) into has_pending;

  return not has_pending;
end;
$$;

grant execute on function public.get_last_position(uuid) to authenticated;
grant execute on function public.try_acquire_user_ai_lock(uuid) to authenticated;
