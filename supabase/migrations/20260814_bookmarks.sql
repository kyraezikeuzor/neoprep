-- Bookmarks: persistent "Mark for Review" / Saved questions
-- Run in Supabase SQL editor if not applied via CLI.

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  question_id text not null,
  created_at timestamptz not null default now(),
  unique (student_id, question_id)
);

create index if not exists bookmarks_student_id_idx on public.bookmarks (student_id);
create index if not exists bookmarks_question_id_idx on public.bookmarks (question_id);

alter table public.bookmarks enable row level security;

drop policy if exists "Students can read own bookmarks" on public.bookmarks;
create policy "Students can read own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = student_id);

drop policy if exists "Students can insert own bookmarks" on public.bookmarks;
create policy "Students can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = student_id);

drop policy if exists "Students can delete own bookmarks" on public.bookmarks;
create policy "Students can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = student_id);
