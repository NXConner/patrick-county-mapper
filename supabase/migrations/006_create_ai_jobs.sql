-- Queue for batch AI analyses
create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','cancelled')),
  aoi jsonb not null, -- area of interest (bbox/geojson)
  params jsonb not null, -- analysis parameters
  result jsonb,
  error text
);

create index if not exists idx_ai_jobs_status on public.ai_jobs(status);
alter table public.ai_jobs enable row level security;

create policy if not exists "ai_jobs_read"
on public.ai_jobs for select to authenticated using (created_by = auth.uid());

create policy if not exists "ai_jobs_insert"
on public.ai_jobs for insert to authenticated with check (created_by = auth.uid() or created_by is null);

create policy if not exists "ai_jobs_update_self"
on public.ai_jobs for update to authenticated using (created_by = auth.uid());

