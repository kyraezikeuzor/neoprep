-- Practice Test 1 now lives exclusively in the dedicated timed-test flow.
-- Remove the legacy assignment so students are not sent to a duplicate test.
delete from public.problems
where assignment_id in (
  select id from public.assignments
  where title = 'SAT Practice Test 3: 27 R&W / 22 Math'
);

delete from public.assignments
where title = 'SAT Practice Test 3: 27 R&W / 22 Math';
