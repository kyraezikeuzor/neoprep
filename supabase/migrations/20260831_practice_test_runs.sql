-- Preserve each completed test instead of overwriting a student's prior answers.
create table if not exists public.test_runs (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.test_attempts add column if not exists run_id uuid references public.test_runs(id) on delete cascade;

-- Put historic responses into one completed run per student/test before making
-- run_id part of the key.
insert into public.test_runs (test_id, user_id, status, started_at, completed_at)
select test_id, user_id, 'completed', min(updated_at), max(updated_at)
from public.test_attempts
where run_id is null
group by test_id, user_id;

update public.test_attempts attempt
set run_id = run.id
from public.test_runs run
where attempt.run_id is null
  and run.test_id = attempt.test_id
  and run.user_id = attempt.user_id
  and run.status = 'completed';

alter table public.test_attempts alter column run_id set not null;
alter table public.test_attempts drop constraint if exists test_attempts_pkey;
alter table public.test_attempts add primary key (run_id, question_id);
create index if not exists test_runs_user_test_idx on public.test_runs(user_id, test_id, started_at desc);
create index if not exists test_attempts_run_idx on public.test_attempts(run_id);
