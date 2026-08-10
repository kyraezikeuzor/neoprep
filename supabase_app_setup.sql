-- Run this in the Supabase SQL editor before using the app.

-- 1. Enable RLS (safe to run even if already enabled)
alter table questions enable row level security;
alter table attempts enable row level security;

-- 2. Any signed-in user can read the question bank
drop policy if exists "questions readable by authenticated users" on questions;
create policy "questions readable by authenticated users"
  on questions for select
  to authenticated
  using (true);

-- 3. Users can insert their own attempts...
drop policy if exists "users insert own attempts" on attempts;
create policy "users insert own attempts"
  on attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 4. ...and read their own attempt history (useful later for progress views)
drop policy if exists "users read own attempts" on attempts;
create policy "users read own attempts"
  on attempts for select
  to authenticated
  using (auth.uid() = user_id);

-- 5. question_type wasn't in the original schema - the app uses it to decide
--    multiple-choice vs. free-response rendering (falls back to checking
--    whether `choices` is empty if you'd rather not backfill this column)
alter table questions add column if not exists question_type text;

-- 6. Profiles: users can read/insert their own row; auto-create on auth signup
alter table profiles enable row level security;

drop policy if exists "users read own profile" on profiles;
create policy "users read own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "users insert own profile" on profiles;
create policy "users insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- When a new auth.users row is created (Google OAuth, magic link, etc.),
-- insert a matching profiles row with role = student.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, 'student'), '@', 1)
    ),
    'student',
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
