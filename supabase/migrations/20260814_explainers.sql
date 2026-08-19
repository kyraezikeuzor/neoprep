-- Explainers: track when a question was explained (e.g. for social / Playground)
-- Run in Supabase SQL editor if not applied via CLI.

create table if not exists public.explainers (
  id uuid primary key default gen_random_uuid(),
  question_id text not null,
  recorded_at timestamptz not null default now(),
  created_by uuid not null references auth.users (id) on delete cascade
);

create index if not exists explainers_question_id_idx on public.explainers (question_id);
create index if not exists explainers_recorded_at_idx on public.explainers (recorded_at desc);
create index if not exists explainers_created_by_idx on public.explainers (created_by);

alter table public.explainers enable row level security;

-- Admins manage explainers via the service-role client in server actions.
-- Authenticated admins can also read/insert directly if needed.
drop policy if exists "Admins can read explainers" on public.explainers;
create policy "Admins can read explainers"
  on public.explainers for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Admins can insert explainers" on public.explainers;
create policy "Admins can insert explainers"
  on public.explainers for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
