-- Export queue for background processing and retries
create table if not exists public.export_queue (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  export_type text not null, -- 'png' | 'pdf' | 'report' | ...
  options jsonb not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  retries int not null default 0,
  max_retries int not null default 3,
  result jsonb,
  error text
);

create index if not exists idx_export_queue_status on public.export_queue(status);
alter table public.export_queue enable row level security;

create policy if not exists "export_queue_own"
on public.export_queue for select to authenticated using (created_by = auth.uid());

create policy if not exists "export_queue_insert"
on public.export_queue for insert to authenticated with check (created_by = auth.uid() or created_by is null);

create policy if not exists "export_queue_update_own"
on public.export_queue for update to authenticated using (created_by = auth.uid());

