create table if not exists public.live_session_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id text not null,
  bootcamp_id bigint not null,
  session_date date not null,
  session_title text not null default 'Live class',
  time_label text,
  status text not null default 'joined' check (status in ('joined', 'attended')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, session_id)
);

create index if not exists live_session_attendance_student_date_idx
  on public.live_session_attendance (student_id, session_date desc);

alter table public.live_session_attendance enable row level security;

drop policy if exists "Students can view own live attendance"
  on public.live_session_attendance;

create policy "Students can view own live attendance"
  on public.live_session_attendance
  for select
  using (auth.uid() = student_id);
