-- Enable required extensions
create extension if not exists pgcrypto;

-- =============================================
-- PROFILES (mirror minimal user info from auth.users)
-- =============================================
create table if not exists public.profiles (
  id uuid primary key,
  email text
);

alter table public.profiles enable row level security;

-- Allow authenticated users to read minimal profile info (id, email)
create policy if not exists profiles_select_authenticated
  on public.profiles
  for select
  to authenticated
  using (true);

-- Sync profiles from auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create or replace function public.handle_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_updated();

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function public.handle_user_deleted();

-- =============================================
-- WORKSPACES
-- =============================================
create table if not exists public.workspaces (
  name text primary key,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trig_workspaces_set_updated_at on public.workspaces;
create trigger trig_workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- Memberships for workspaces
create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_name text not null references public.workspaces(name) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_name, user_id)
);

-- After creating a workspace, automatically add creator as owner member
create or replace function public.create_owner_membership()
returns trigger
language plpgsql
as $$
begin
  insert into public.workspace_members (workspace_name, user_id, role)
  values (new.name, new.created_by, 'owner')
  on conflict (workspace_name, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trig_workspaces_owner_membership on public.workspaces;
create trigger trig_workspaces_owner_membership
  after insert on public.workspaces
  for each row execute function public.create_owner_membership();

-- Versions per workspace
create table if not exists public.workspace_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_name text not null references public.workspaces(name) on delete cascade,
  version int not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (workspace_name, version)
);

create index if not exists idx_workspace_members_workspace on public.workspace_members (workspace_name);
create index if not exists idx_workspace_members_user on public.workspace_members (user_id);
create index if not exists idx_workspace_versions_ws_ver on public.workspace_versions (workspace_name, version desc);

-- RLS
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_versions enable row level security;

-- Workspaces policies
create policy if not exists workspaces_insert_by_creator
  on public.workspaces
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy if not exists workspaces_select_members
  on public.workspaces
  for select
  to authenticated
  using (exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid()
  ));

create policy if not exists workspaces_update_owner_or_editor
  on public.workspaces
  for update
  to authenticated
  using (exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid() and m.role in ('owner','editor')
  ))
  with check (exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspaces.name and m.user_id = auth.uid() and m.role in ('owner','editor')
  ));

-- Workspace members policies
create policy if not exists workspace_members_select_members
  on public.workspace_members
  for select
  to authenticated
  using (exists (
    select 1 from public.workspace_members m2
    where m2.workspace_name = workspace_members.workspace_name and m2.user_id = auth.uid()
  ));

-- Allow inserting yourself as owner when creating workspace (trigger) OR owners adding others
create policy if not exists workspace_members_insert_self_or_owner
  on public.workspace_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.workspace_members m2
      where m2.workspace_name = workspace_members.workspace_name and m2.user_id = auth.uid() and m2.role = 'owner'
    )
  );

-- Owners can delete memberships
create policy if not exists workspace_members_delete_owner
  on public.workspace_members
  for delete
  to authenticated
  using (exists (
    select 1 from public.workspace_members m2
    where m2.workspace_name = workspace_members.workspace_name and m2.user_id = auth.uid() and m2.role = 'owner'
  ));

-- Workspace versions policies: members can read; owners/editors can insert
create policy if not exists workspace_versions_select_members
  on public.workspace_versions
  for select
  to authenticated
  using (exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspace_versions.workspace_name and m.user_id = auth.uid()
  ));

create policy if not exists workspace_versions_insert_owner_or_editor
  on public.workspace_versions
  for insert
  to authenticated
  with check (exists (
    select 1 from public.workspace_members m
    where m.workspace_name = workspace_versions.workspace_name and m.user_id = auth.uid() and m.role in ('owner','editor')
  ));

-- =============================================
-- BOOKMARKS
-- =============================================
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  state jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookmarks_user on public.bookmarks (user_id, created_at desc);

alter table public.bookmarks enable row level security;

create policy if not exists bookmarks_select_own
  on public.bookmarks
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists bookmarks_insert_own
  on public.bookmarks
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy if not exists bookmarks_delete_own
  on public.bookmarks
  for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================
-- EXPORT QUEUE & LOGS
-- =============================================
create table if not exists public.export_queue (
  id uuid primary key default gen_random_uuid(),
  export_type text not null check (export_type in ('png','pdf','report')),
  options jsonb not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  retries int not null default 0,
  max_retries int not null default 3,
  result jsonb,
  error text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_queue_status on public.export_queue (status);
create index if not exists idx_export_queue_created_by on public.export_queue (created_by, created_at desc);

alter table public.export_queue enable row level security;

create policy if not exists export_queue_select_own
  on public.export_queue
  for select
  to authenticated
  using (created_by = auth.uid());

create policy if not exists export_queue_insert_own
  on public.export_queue
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy if not exists export_queue_update_own
  on public.export_queue
  for update
  to authenticated
  using (created_by = auth.uid());

create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  export_type text not null,
  options jsonb not null,
  status text not null check (status in ('queued','completed','failed')),
  error text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_export_logs_user on public.export_logs (user_id, created_at desc);

alter table public.export_logs enable row level security;

create policy if not exists export_logs_select_own
  on public.export_logs
  for select
  to authenticated
  using (user_id = auth.uid());

create policy if not exists export_logs_insert
  on public.export_logs
  for insert
  to authenticated
  with check (user_id is null or user_id = auth.uid());

-- =============================================
-- AI JOBS
-- =============================================
create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  aoi jsonb not null,
  params jsonb not null,
  result jsonb,
  error text,
  retries int not null default 0,
  max_retries int not null default 3,
  created_by uuid not null default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_jobs_created_by on public.ai_jobs (created_by, created_at desc);
create index if not exists idx_ai_jobs_status on public.ai_jobs (status);

alter table public.ai_jobs enable row level security;

create policy if not exists ai_jobs_select_own
  on public.ai_jobs
  for select
  to authenticated
  using (created_by = auth.uid());

create policy if not exists ai_jobs_insert_own
  on public.ai_jobs
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy if not exists ai_jobs_update_own
  on public.ai_jobs
  for update
  to authenticated
  using (created_by = auth.uid());

-- =============================================
-- COST CATALOG
-- =============================================
create table if not exists public.cost_catalog (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  is_default boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.cost_catalog(id) on delete cascade,
  code text not null,
  name text not null,
  unit text not null,
  unit_cost numeric not null,
  material_type text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cost_items_catalog on public.cost_items (catalog_id);

alter table public.cost_catalog enable row level security;
alter table public.cost_items enable row level security;

create policy if not exists cost_catalog_select_auth
  on public.cost_catalog
  for select
  to authenticated
  using (true);

create policy if not exists cost_catalog_insert_own
  on public.cost_catalog
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy if not exists cost_items_select_auth
  on public.cost_items
  for select
  to authenticated
  using (true);

create policy if not exists cost_items_insert_catalog_owner
  on public.cost_items
  for insert
  to authenticated
  with check (exists (
    select 1 from public.cost_catalog c
    where c.id = cost_items.catalog_id and c.created_by = auth.uid()
  ));

-- =============================================
-- PROPERTIES DATASET (read-only public data)
-- =============================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  parcel_id text not null,
  owner_name text,
  property_address text,
  acreage numeric,
  tax_value numeric,
  zoning text,
  latitude numeric,
  longitude numeric
);

create unique index if not exists idx_properties_parcel on public.properties (parcel_id);
create index if not exists idx_properties_coords on public.properties (latitude, longitude);

create table if not exists public.property_sales (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  sale_date date,
  sale_price numeric,
  buyer_name text,
  seller_name text,
  deed_book text,
  deed_page text
);

create index if not exists idx_property_sales_property on public.property_sales (property_id, sale_date desc);

create table if not exists public.property_assessments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  assessment_year int,
  land_value numeric,
  improvement_value numeric,
  total_value numeric,
  exemptions text,
  taxable_value numeric
);

create index if not exists idx_property_assessments_property on public.property_assessments (property_id, assessment_year desc);

create table if not exists public.property_utilities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  utility_name text not null
);

create index if not exists idx_property_utilities_property on public.property_utilities (property_id);

-- RLS for properties tables is intentionally left DISABLED to allow public/anonymous read access
-- Enable if you need to restrict access and add appropriate policies.

-- =============================================
-- RPC: properties_within_radius(lat, lng, radius_miles)
-- =============================================
create or replace function public.properties_within_radius(
  p_lat numeric,
  p_lng numeric,
  p_radius_miles numeric
)
returns setof public.properties
language sql
stable
as $$
  select *
  from public.properties pr
  where pr.latitude is not null and pr.longitude is not null
    and (
      3958.7613 * 2 * asin(
        sqrt(
          power(sin(radians((pr.latitude - p_lat) / 2)), 2) +
          cos(radians(p_lat)) * cos(radians(pr.latitude)) * power(sin(radians((pr.longitude - p_lng) / 2)), 2)
        )
      )
    ) <= p_radius_miles;
$$;

