-- Export logs to track generated outputs
create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null,
  export_type text not null,
  options jsonb,
  status text not null default 'completed' check (status in ('queued','completed','failed')),
  error text
);

create index if not exists idx_export_logs_user on public.export_logs(user_id);
alter table public.export_logs enable row level security;

create policy if not exists "export_logs_read"
on public.export_logs for select to authenticated using (user_id = auth.uid());

create policy if not exists "export_logs_insert"
on public.export_logs for insert to authenticated with check (user_id = auth.uid() or user_id is null);

