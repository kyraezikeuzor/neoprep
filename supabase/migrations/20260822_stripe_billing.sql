-- Stripe billing state. Reuses the existing subscriptions table used by bootcamp access.

alter table public.profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists profiles_stripe_customer_id_unique
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  monthly_price numeric(10, 2),
  started_at timestamptz not null default now(),
  status text not null default 'active'
);

alter table public.subscriptions
  -- Existing bootcamp rows are manual records. Stripe webhooks explicitly set
  -- provider='stripe' for new billing records.
  add column if not exists provider text not null default 'manual',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_price_id text,
  add column if not exists billing_interval text,
  add column if not exists billing_interval_count integer,
  add column if not exists amount_cents integer,
  add column if not exists currency text default 'usd',
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists access_ends_at timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists canceled_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists subscriptions_stripe_subscription_id_unique
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

create unique index if not exists subscriptions_stripe_checkout_session_id_unique
  on public.subscriptions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists subscriptions_student_id_idx
  on public.subscriptions (student_id);

alter table public.subscriptions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'subscriptions'
      and policyname = 'Students can view their own subscriptions'
  ) then
    create policy "Students can view their own subscriptions"
      on public.subscriptions
      for select
      using (auth.uid() = student_id);
  end if;
end
$$;
