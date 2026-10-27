-- Estudaí database schema for Supabase (PostgreSQL).
-- Run the whole file in the Supabase SQL Editor. It is safe to run more than
-- once; existing tables are not altered, so column changes need their own statement.
--
-- Every table has row level security: users can only read and write rows
-- whose user_id matches auth.uid().

do $$ begin
  create type public.content_status as enum ('a_estudar', 'estudando', 'revisado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_type as enum ('prova', 'trabalho', 'atividade', 'outro');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  exam_reminder_enabled boolean not null default true,
  exam_reminder_days_before smallint not null default 1 check (exam_reminder_days_before between 0 and 7),
  exam_reminder_time time not null default '23:59',
  assignment_reminder_enabled boolean not null default true,
  assignment_reminder_days_before smallint not null default 1 check (assignment_reminder_days_before between 0 and 7),
  assignment_reminder_time time not null default '23:59',
  high_priority_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile on sign up, using the name sent in the auth metadata.
-- security definer is required because new users cannot insert into profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  teacher text,
  color text not null default '#55B572',
  created_at timestamptz not null default now()
);
create index if not exists subjects_user_idx on public.subjects (user_id);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  status public.content_status not null default 'a_estudar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contents_subject_idx on public.contents (subject_id);

drop trigger if exists contents_updated_at on public.contents;
create trigger contents_updated_at before update on public.contents
  for each row execute function public.set_updated_at();

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  due_date date not null default current_date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on public.tasks (user_id, due_date);

-- Deleting a subject keeps its events in the calendar (subject_id becomes null).
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  type public.event_type not null default 'prova',
  title text not null check (char_length(title) between 1 and 120),
  starts_at timestamptz not null,
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists events_user_start_idx on public.events (user_id, starts_at);

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.contents enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;

-- No insert or delete policy on profiles: rows are created by the trigger and
-- removed by the cascade from auth.users.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare t text;
begin
  foreach t in array array['subjects', 'contents', 'tasks', 'events'] loop
    execute format('drop policy if exists %I on public.%I', t || '_all_own', t);
    execute format(
      'create policy %I on public.%I for all to authenticated
         using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_all_own', t);
  end loop;
end $$;

-- Called from Profile > Excluir conta. Deleting the auth user cascades to the
-- profile and every row the user owns. security definer is what allows a
-- regular user to delete from auth.users, so the function only ever targets
-- auth.uid() and is not executable by anonymous clients.
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- Profile photos. The bucket is public so avatars load without signed URLs.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Uploads are restricted to a folder named after the user: avatars/<user_id>/...
drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
