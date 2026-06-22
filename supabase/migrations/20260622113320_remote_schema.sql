drop policy "Enable read access for authenticated users" on "public"."ai_generations";

alter table "public"."tasks" alter column "position" set default ''::text;

alter table "public"."tasks" alter column "title" set not null;


