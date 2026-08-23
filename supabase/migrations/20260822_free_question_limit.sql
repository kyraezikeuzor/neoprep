-- Enforce the free-plan allowance at the data boundary as well as in the app.

create index if not exists attempts_user_question_idx
  on public.attempts (user_id, question_id);

create or replace function public.enforce_free_question_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Reviews do not consume another free question.
  if exists (
    select 1
    from public.attempts
    where user_id = new.user_id
      and question_id = new.question_id
  ) then
    return new;
  end if;

  if exists (
    select 1
    from public.profiles
    where id = new.user_id
      and role = 'admin'
  ) then
    return new;
  end if;

  if exists (
    select 1
    from public.subscriptions
    where student_id = new.user_id
      and status in ('active', 'trialing')
      and coalesce(access_ends_at, current_period_end, 'infinity'::timestamptz) > now()
  ) then
    return new;
  end if;

  if (
    select count(distinct question_id)
    from public.attempts
    where user_id = new.user_id
  ) >= 100 then
    raise exception using
      errcode = 'P0001',
      message = 'You have completed the 100 questions included with the Free plan. Upgrade to Pro to keep practicing new questions.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_question_limit_before_insert on public.attempts;

create trigger enforce_free_question_limit_before_insert
before insert on public.attempts
for each row
execute function public.enforce_free_question_limit();
