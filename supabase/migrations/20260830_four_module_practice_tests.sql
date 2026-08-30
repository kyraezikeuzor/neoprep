-- Expand timed tests from two sections into the four Digital SAT modules.
alter table public.test_questions drop constraint if exists test_questions_module_check;

update public.test_questions
set module = case module
  when 'reading_writing' then 'reading_writing_1'
  when 'math' then 'math_1'
  else module
end;

alter table public.test_questions
  add constraint test_questions_module_check
  check (module in ('reading_writing_1', 'reading_writing_2', 'math_1', 'math_2'));

-- Give Practice Test 1 a distinct second Reading/Writing module and second
-- Math module. Existing linked questions stay in Module 1; the additions are
-- selected from unused questions so a test never repeats a question.
with target as (
  select id from public.tests where title = 'Practice Test 1'
), candidates as (
  select t.id as test_id, q.question_id,
    row_number() over (partition by t.id order by q.question_id) as position
  from target t
  cross join public.questions q
  where q.domain not in ('Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry')
    and not exists (
      select 1 from public.test_questions linked
      where linked.test_id = t.id and linked.question_id = q.question_id
    )
)
insert into public.test_questions (test_id, question_id, module, position)
select test_id, question_id, 'reading_writing_2', position
from candidates
where position <= 27
on conflict (test_id, question_id) do nothing;

with target as (
  select id from public.tests where title = 'Practice Test 1'
), candidates as (
  select t.id as test_id, q.question_id,
    row_number() over (partition by t.id order by q.question_id) as position
  from target t
  cross join public.questions q
  where q.domain in ('Algebra', 'Advanced Math', 'Problem-Solving and Data Analysis', 'Geometry and Trigonometry')
    and not exists (
      select 1 from public.test_questions linked
      where linked.test_id = t.id and linked.question_id = q.question_id
    )
)
insert into public.test_questions (test_id, question_id, module, position)
select test_id, question_id, 'math_2', position
from candidates
where position <= 22
on conflict (test_id, question_id) do nothing;
