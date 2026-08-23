-- Let Roadmap assignments and live classes exist independently of a legacy Bootcamp.
-- Existing Bootcamp-linked rows remain valid and readable during the transition.

alter table public.assignments
  add column if not exists student_id uuid references public.students(id) on delete cascade,
  add column if not exists source text not null default 'legacy',
  add column if not exists sequence_number integer;

alter table public.assignments alter column bootcamp_id drop not null;

create index if not exists assignments_student_id_created_at_idx
  on public.assignments (student_id, created_at desc);

alter table public.sessions
  add column if not exists title text,
  add column if not exists starts_at timestamptz,
  add column if not exists meeting_url text,
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists timezone text not null default 'America/Chicago';

alter table public.sessions alter column bootcamp_id drop not null;
alter table public.sessions alter column session_date drop not null;

create index if not exists sessions_starts_at_idx
  on public.sessions (starts_at asc);

-- Attendance was introduced in a companion migration in some deployments.
-- Create it here too so this migration is safe when applied independently.
create table if not exists public.live_session_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id text not null,
  bootcamp_id bigint,
  session_date date not null,
  session_title text not null default 'Live class',
  time_label text,
  status text not null default 'joined' check (status in ('joined', 'attended')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, session_id)
);

alter table public.live_session_attendance alter column bootcamp_id drop not null;
