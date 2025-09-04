-- Workspaces table for saving map state and drawings
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  owner uuid references auth.users(id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.workspaces enable row level security;

-- Policies
create policy if not exists "workspaces_read"
on public.workspaces
for select
to authenticated, anon
using (true);

create policy if not exists "workspaces_insert"
on public.workspaces
for insert
to authenticated
with check (auth.uid() = owner or owner is null);

create policy if not exists "workspaces_update"
on public.workspaces
for update
to authenticated
using (auth.uid() = owner or owner is null)
with check (auth.uid() = owner or owner is null);

create policy if not exists "workspaces_upsert_by_name"
on public.workspaces
for insert
to authenticated
with check (true);

-- Trigger to update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

