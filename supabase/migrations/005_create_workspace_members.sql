-- Membership and ACL for shared workspaces
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_workspace_members_unique on public.workspace_members(workspace_name, user_id);

alter table public.workspace_members enable row level security;

create policy if not exists "workspace_members_self"
on public.workspace_members for select to authenticated using (user_id = auth.uid());

create policy if not exists "workspace_members_insert"
on public.workspace_members for insert to authenticated with check (user_id = auth.uid());

