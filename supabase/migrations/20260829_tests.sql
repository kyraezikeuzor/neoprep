create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  reading_minutes integer not null default 32,
  math_minutes integer not null default 35,
  created_at timestamptz not null default now()
);

create table if not exists public.test_questions (
  test_id uuid not null references public.tests(id) on delete cascade,
  question_id text not null references public.questions(question_id),
  module text not null check (module in ('reading_writing', 'math')),
  position integer not null,
  primary key (test_id, question_id),
  unique (test_id, module, position)
);

create table if not exists public.test_attempts (
  test_id uuid not null references public.tests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(question_id),
  selected_answer text,
  updated_at timestamptz not null default now(),
  primary key (test_id, user_id, question_id)
);

create index if not exists test_questions_test_module_idx on public.test_questions(test_id, module, position);
create index if not exists test_attempts_user_test_idx on public.test_attempts(user_id, test_id);

-- Copy the existing SAT practice assignment into the dedicated timed-test model.
with inserted_test as (
  insert into public.tests (title, description)
  select 'Practice Test 1', 'Timed SAT practice: 27 Reading & Writing questions, then 22 Math questions.'
  where not exists (select 1 from public.tests where title = 'Practice Test 1')
  returning id
), chosen_test as (
  select id from inserted_test union all select id from public.tests where title = 'Practice Test 1' limit 1
), source_questions as (
  select p.question_id, q.domain,
    row_number() over (partition by case when q.domain in ('Algebra','Advanced Math','Problem-Solving and Data Analysis','Geometry and Trigonometry') then 'math' else 'reading_writing' end order by p.question_id) as position
  from public.assignments a join public.problems p on p.assignment_id = a.id join public.questions q on q.question_id = p.question_id
  where a.title ilike 'SAT Practice Test%'
)
insert into public.test_questions (test_id, question_id, module, position)
select t.id, s.question_id, case when s.domain in ('Algebra','Advanced Math','Problem-Solving and Data Analysis','Geometry and Trigonometry') then 'math' else 'reading_writing' end, s.position
from chosen_test t cross join source_questions s
on conflict (test_id, question_id) do nothing;
