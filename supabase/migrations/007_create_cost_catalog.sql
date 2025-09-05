-- Cost catalog and items for estimation
create table if not exists public.cost_catalog (
  id uuid primary key default gen_random_uuid(),
  region text not null,
  is_default boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid not null references public.cost_catalog(id) on delete cascade,
  code text not null,
  name text not null,
  unit text not null,
  unit_cost numeric not null,
  material_type text,
  notes text
);

create index if not exists idx_cost_items_catalog on public.cost_items(catalog_id);

alter table public.cost_catalog enable row level security;
alter table public.cost_items enable row level security;

create policy if not exists "cost_catalog_read"
on public.cost_catalog for select to authenticated, anon using (true);

create policy if not exists "cost_items_read"
on public.cost_items for select to authenticated, anon using (true);

create policy if not exists "cost_catalog_write"
on public.cost_catalog for insert to authenticated with check (true);

create policy if not exists "cost_items_write"
on public.cost_items for insert to authenticated with check (true);

