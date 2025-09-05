-- User bookmarks/favorites
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  state jsonb not null -- same shape as MapUrlState
);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
alter table public.bookmarks enable row level security;

create policy if not exists "bookmarks_read"
on public.bookmarks for select to authenticated using (user_id = auth.uid());

create policy if not exists "bookmarks_write"
on public.bookmarks for insert to authenticated with check (user_id = auth.uid());

create policy if not exists "bookmarks_update_delete"
on public.bookmarks for update using (user_id = auth.uid());

