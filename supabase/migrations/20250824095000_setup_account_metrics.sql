-- Ensure table and columns for EA snapshots
create table if not exists public.account_metrics (
  id uuid primary key default gen_random_uuid(),
  account_number text not null,
  balance numeric,
  equity numeric,
  floating numeric,
  free_margin numeric,
  open_positions integer,
  user_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists account_metrics_account_number_created_at_idx
on public.account_metrics(account_number, created_at desc);

-- Enable realtime (no-op if already added)
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.account_metrics';
  exception when duplicate_object then
    -- already added
    null;
  end;
end$$;

-- RLS
alter table public.account_metrics enable row level security;

drop policy if exists account_metrics_insert_anon on public.account_metrics;
create policy account_metrics_insert_anon
on public.account_metrics
for insert
to anon
with check (true);

drop policy if exists account_metrics_select_own on public.account_metrics;
create policy account_metrics_select_own
on public.account_metrics
for select
to authenticated
using (
  account_number::text in (
    select login::text from public.mt_accounts where user_id = auth.uid()
  )
);

-- Trigger: auto-map user_id from mt_accounts on insert
create or replace function public.map_user_from_mt_accounts()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then
    select m.user_id into new.user_id
    from public.mt_accounts m
    where m.login::text = new.account_number::text
    limit 1;
  end if;
  return new;
end $$;

drop trigger if exists account_metrics_set_user_id on public.account_metrics;
create trigger account_metrics_set_user_id
before insert on public.account_metrics
for each row execute function public.map_user_from_mt_accounts();









