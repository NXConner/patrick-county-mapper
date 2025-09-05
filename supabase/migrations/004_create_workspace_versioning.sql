-- Version history for workspaces
create table if not exists public.workspace_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_name text not null,
  version int not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists idx_workspace_versions_name_ver on public.workspace_versions(workspace_name, version desc);

alter table public.workspace_versions enable row level security;

create policy if not exists "workspace_versions_read"
on public.workspace_versions for select to authenticated, anon using (true);

create policy if not exists "workspace_versions_insert"
on public.workspace_versions for insert to authenticated with check (true);

