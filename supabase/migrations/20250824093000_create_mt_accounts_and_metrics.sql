-- Ensure extensions
create extension if not exists pgcrypto;

-- mt_accounts: links a user's MT4/5 logins
create table if not exists public.mt_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  login text not null,
  broker text not null,
  platform text not null check (platform in ('MT4','MT5')),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists mt_accounts_user_idx on public.mt_accounts (user_id);

-- RLS
alter table public.mt_accounts enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mt_accounts' and policyname='mt_accounts_select_own'
  ) then
create policy "mt_accounts_select_own"
  on public.mt_accounts for select
  to authenticated
  using (user_id = auth.uid());
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mt_accounts' and policyname='mt_accounts_insert_own'
  ) then
create policy "mt_accounts_insert_own"
  on public.mt_accounts for insert
  to authenticated
  with check (user_id = auth.uid());
  end if;
end $$;

-- account_metrics: incoming snapshots from EAs (posted with anon key)
create table if not exists public.account_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  platform text not null check (platform in ('MT4','MT5')),
  account_number text not null,
  currency text,
  balance numeric,
  equity numeric,
  floating numeric,
  freeMargin numeric,
  openPositions integer,
  product_code text,
  created_at timestamptz not null default now()
);

create index if not exists account_metrics_account_idx on public.account_metrics (account_number);
create index if not exists account_metrics_user_idx on public.account_metrics (user_id, created_at desc);

alter table public.account_metrics enable row level security;

-- Allow inserts from anon (EAs use anon key). Consider tightening later with signed JWT / edge function.
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='account_metrics' and policyname='account_metrics_insert_anon'
  ) then
create policy "account_metrics_insert_anon"
  on public.account_metrics for insert
  to anon
  with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='account_metrics' and policyname='account_metrics_select_all_auth'
  ) then
create policy "account_metrics_select_all_auth"
  on public.account_metrics for select
  to authenticated
  using (true);
  end if;
end $$;

-- Ensure storage bucket for setfiles exists
insert into storage.buckets (id, name, public)
values ('expert-advisors', 'expert-advisors', true)
on conflict (id) do nothing;

-- Storage policies for expert-advisors bucket
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'ea_public_read'
  ) then
    create policy "ea_public_read" on storage.objects
      for select to public
      using ( bucket_id = 'expert-advisors' );
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'ea_auth_write'
  ) then
    create policy "ea_auth_write" on storage.objects
      for insert to authenticated
      with check ( bucket_id = 'expert-advisors' );
  end if;
end $$;
