-- Trades insert RPC and KPI view

create table if not exists public.trade_events (
  id uuid primary key default gen_random_uuid(),
  account_number text not null,
  symbol text not null,
  type text not null,
  size numeric not null,
  entry_time timestamptz not null,
  exit_time timestamptz not null,
  entry_price numeric not null,
  exit_price numeric not null,
  commission numeric default 0,
  swap numeric default 0,
  result numeric not null,
  created_at timestamptz default now()
);

create index if not exists trade_events_account_time_idx on public.trade_events(account_number, exit_time desc);

create or replace function public.insert_trade(
  p_account_number text,
  p_symbol text,
  p_type text,
  p_size numeric,
  p_entry_time timestamptz,
  p_exit_time timestamptz,
  p_entry_price numeric,
  p_exit_price numeric,
  p_commission numeric,
  p_swap numeric,
  p_result numeric
) returns void
language sql
security definer
set search_path = public as $$
  insert into public.trade_events(
    account_number, symbol, type, size, entry_time, exit_time, entry_price, exit_price, commission, swap, result
  ) values (
    p_account_number, p_symbol, p_type, p_size, p_entry_time, p_exit_time, p_entry_price, p_exit_price, p_commission, p_swap, p_result
  );
$$;

revoke all on function public.insert_trade(text,text,text,numeric,timestamptz,timestamptz,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.insert_trade(text,text,text,numeric,timestamptz,timestamptz,numeric,numeric,numeric,numeric,numeric) to anon, authenticated;

-- Snapshot table (raw facts)
create table if not exists public.account_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_number text not null,
  balance numeric,
  equity numeric,
  floating numeric,
  free_margin numeric,
  open_positions integer,
  created_at timestamptz default now()
);

create index if not exists account_snapshots_account_time_idx on public.account_snapshots(account_number, created_at desc);

-- KPI view (last 30 days example); compute from trades and snapshots
create or replace view public.account_kpi_view as
select
  s.account_number,
  (select balance from account_snapshots s2 where s2.account_number=s.account_number order by created_at desc limit 1) as balance,
  (select equity from account_snapshots s2 where s2.account_number=s.account_number order by created_at desc limit 1) as equity,
  coalesce(sum(case when t.result>0 then t.result else 0 end),0) as gross_profit,
  abs(coalesce(sum(case when t.result<0 then t.result else 0 end),0)) as gross_loss,
  case when abs(coalesce(sum(case when t.result<0 then t.result else 0 end),0))>0
    then coalesce(sum(case when t.result>0 then t.result else 0 end),0) / abs(sum(case when t.result<0 then t.result else 0 end))
    else 0 end as profit_factor,
  count(*) filter (where t.result>0) as wins,
  count(*) filter (where t.result<0) as losses,
  case when count(*)>0 then 100.0*count(*) filter (where t.result>0)/count(*) else 0 end as win_rate,
  case when count(*) filter (where t.result>0)>0 then avg(t.result) filter (where t.result>0) else 0 end as average_win,
  case when count(*) filter (where t.result<0)>0 then abs(avg(t.result) filter (where t.result<0)) else 0 end as average_loss,
  count(*) as total_orders
from account_snapshots s
left join trade_events t on t.account_number=s.account_number and t.exit_time>=now()-interval '30 days'
group by s.account_number;






