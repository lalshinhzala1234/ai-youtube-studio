-- ==============================================================================
-- AI YOUTUBE STUDIO — SUPABASE POSTGRESQL DATABASE SCHEMA & ROW LEVEL SECURITY
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 2. Create projects table
create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  idea text not null default '',
  settings jsonb not null default '{}'::jsonb,
  concept jsonb not null default '{}'::jsonb,
  hook jsonb not null default '{}'::jsonb,
  script jsonb not null default '{}'::jsonb,
  characters jsonb not null default '[]'::jsonb,
  scenes jsonb not null default '[]'::jsonb,
  video_prompts jsonb not null default '[]'::jsonb,
  thumbnail jsonb not null default '{}'::jsonb,
  youtube_seo jsonb not null default '{}'::jsonb,
  shorts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Create index for fast user-scoped queries and ordering
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);

-- 4. Enable Row Level Security (RLS) on projects table
alter table public.projects enable row level security;

-- 5. Row Level Security Policies (Enforce complete user isolation)

-- Policy: Select (Users can only read their own projects)
create policy "Users can view own projects"
  on public.projects
  for select
  using (auth.uid() = user_id);

-- Policy: Insert (Users can only insert projects with their own user_id)
create policy "Users can insert own projects"
  on public.projects
  for insert
  with check (auth.uid() = user_id);

-- Policy: Update (Users can only update their own projects)
create policy "Users can update own projects"
  on public.projects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Delete (Users can only delete their own projects)
create policy "Users can delete own projects"
  on public.projects
  for delete
  using (auth.uid() = user_id);

-- 6. Trigger to automatically update updated_at timestamp on row modification
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.handle_updated_at();
