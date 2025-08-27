drop view if exists public.account_kpi_view cascade;

create view public.account_kpi_view as
with latest_snap as (
  select distinct on (account_number)
    account_number, balance, equity, created_at
  from public.account_snapshots
  order by account_number, created_at desc
),
trades as (
  select account_number, entry_time, exit_time, result, ticket
  from public.trade_events
  where ticket is not null
),
agg_trades_30d as (
  select
    account_number,
    count(*) as total_orders,
    sum(case when result > 0 then result else 0 end) as gross_profit,
    sum(case when result < 0 then result else 0 end) as gross_loss,
    count(*) filter (where result > 0) as wins,
    count(*) filter (where result < 0) as losses,
    avg(nullif(case when result > 0 then result end, null)) as average_win,
    avg(nullif(case when result < 0 then abs(result) end, null)) as average_loss
  from trades
  where exit_time >= now() - interval '30 days'
  group by account_number
),
last_trade as (
  select account_number, max(entry_time) as last_entry
  from trades
  group by account_number
),
last_trade_count as (
  select t.account_number, l.last_entry, count(*) as last_count
  from trades t
  join last_trade l using (account_number)
  where date(t.entry_time) = date(l.last_entry)
  group by t.account_number, l.last_entry
)
select
  s.account_number,
  s.balance,
  s.equity,
  coalesce(a.total_orders, 0) as total_orders,
  coalesce(a.gross_profit, 0) as gross_profit,
  abs(coalesce(a.gross_loss, 0)) as gross_loss,
  case when abs(coalesce(a.gross_loss, 0)) > 0
       then coalesce(a.gross_profit, 0) / abs(coalesce(a.gross_loss, 0))
       else 0 end as profit_factor,
  case when coalesce(a.total_orders, 0) > 0
       then 100.0 * coalesce(a.wins, 0) / coalesce(a.total_orders, 0)
       else 0 end as win_rate,
  coalesce(a.average_win, 0) as average_win,
  coalesce(a.average_loss, 0) as average_loss,
  -- last trade metrics
  l.last_entry as last_trade_time,
  coalesce(c.last_count, 0) as last_trade_count,
  case when l.last_entry is not null then (now()::date - l.last_entry::date) else null end as last_trade_days_ago
from latest_snap s
left join agg_trades_30d a using (account_number)
left join last_trade l using (account_number)
left join last_trade_count c using (account_number, last_entry);








