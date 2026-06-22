-- ============================================================================
-- Initial schema for ai-to-do-list
-- Source: `supabase db pull` against the live project (verified, not guessed).
-- ============================================================================

SET check_function_bodies = false;

-- This project doesn't use pg_net (no async HTTP calls from Postgres),
-- so it's dropped here to match the live project. Fresh Supabase projects
-- enable it by default, hence the explicit DROP.
DROP EXTENSION IF EXISTS pg_net;

-- Default privileges as they exist on the live project.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

-- ---------------------------------------------------------------------------
-- Enum (note: declared, but the `tasks.status` column below uses plain
-- `text` with a default rather than this enum type)
-- ---------------------------------------------------------------------------
CREATE TYPE public.task_status AS ENUM ('active', 'done', 'archived');

-- ---------------------------------------------------------------------------
-- Functions
-- ---------------------------------------------------------------------------

-- Returns the last fractional-index position among siblings sharing the
-- same parent_task_id (or among top-level tasks when p_parent_id is NULL).
CREATE FUNCTION public.get_last_position(p_parent_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE sql
AS $function$
  select position
  from tasks
  where parent_task_id is not distinct from p_parent_id
  order by position desc
  limit 1;
$function$;

GRANT ALL ON FUNCTION public.get_last_position(uuid) TO anon;
GRANT ALL ON FUNCTION public.get_last_position(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_last_position(uuid) TO service_role;

-- Forces every inserted task's user_id to the authenticated caller,
-- regardless of what the client sends — defense in depth on top of RLS.
CREATE FUNCTION public.set_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.user_id = auth.uid();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_user_id() TO anon;
GRANT ALL ON FUNCTION public.set_user_id() TO authenticated;
GRANT ALL ON FUNCTION public.set_user_id() TO service_role;

-- Transaction-scoped advisory lock keyed by user_id. NOTE: this releases as
-- soon as the calling transaction ends, which for a single RPC call is
-- essentially immediately after it returns -- see the caller's discussion
-- of whether this actually blocks a second request that arrives while a
-- multi-second AI generation is still in flight.
CREATE FUNCTION public.try_acquire_user_ai_lock(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  select pg_try_advisory_xact_lock(hashtext(user_id::text));
$function$;

GRANT ALL ON FUNCTION public.try_acquire_user_ai_lock(uuid) TO anon;
GRANT ALL ON FUNCTION public.try_acquire_user_ai_lock(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.try_acquire_user_ai_lock(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- ai_generations
-- ---------------------------------------------------------------------------
CREATE TABLE public.ai_generations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  task_id uuid NOT NULL,
  user_id uuid,
  feature character varying DEFAULT ''::character varying,
  status character varying DEFAULT ''::character varying,
  model character varying,
  prompt_version character varying,
  prompt text,
  response text,
  input_tokens bigint,
  output_tokens bigint,
  total_tokens bigint,
  error_code character varying,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  duration_ms bigint,
  provider_generation_id text,
  reasoning_tokens bigint,
  cache_hit_tokens bigint,
  cache_miss_tokens bigint,
  finish_reason character varying
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ADD CONSTRAINT ai_generations_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_generations ADD CONSTRAINT ai_generations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

GRANT ALL ON public.ai_generations TO anon;
GRANT ALL ON public.ai_generations TO authenticated;
GRANT ALL ON public.ai_generations TO service_role;

-- Writes go through the service-role admin client only (createAiLog /
-- updateAiLog), so there's deliberately no INSERT/UPDATE policy here.
CREATE POLICY "Enable read access for authenticated users" ON public.ai_generations
  FOR SELECT USING ((auth.uid() = user_id));

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
CREATE TABLE public.tasks (
  title text,
  description text,
  status text DEFAULT 'active'::text NOT NULL,
  priority smallint DEFAULT '3'::smallint,
  due_date timestamp with time zone,
  "position" text DEFAULT ''''''::text NOT NULL, -- NB: this is the 2-char string '' (two literal quote chars), not an empty string -- see caller's note
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(), -- set once at insert; nothing currently refreshes it on update
  completed_at timestamp with time zone,
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  parent_task_id uuid,
  user_id uuid NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.ai_generations ADD CONSTRAINT ai_generations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_parent_task_id_fkey FOREIGN KEY (parent_task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

GRANT ALL ON public.tasks TO anon;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;

CREATE INDEX idx_tasks_parent_id ON public.tasks (parent_task_id);

CREATE TRIGGER set_tasks_user_id BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id();

CREATE POLICY "Enable delete own tasks for authenticated users" ON public.tasks
  FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Enable insert  own tasks for authenticated users only" ON public.tasks
  FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Enable read access own tasks for authenticated users" ON public.tasks
  FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Enable update own tasks for authenticated user" ON public.tasks
  FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));