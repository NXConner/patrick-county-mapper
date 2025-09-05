-- Add retry columns to ai_jobs
alter table public.ai_jobs
  add column if not exists retries int not null default 0,
  add column if not exists max_retries int not null default 3;

