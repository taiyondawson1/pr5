drop view if exists public.account_kpi_view cascade;

create view public.account_kpi_view as
with latest_snap as (
  select distinct on (account_number)
    account_number, balance, equity, created_at
  from public.account_snapshots
  order by account_number, created_at desc
),
trades as (
  select account_number, exit_time, result
  from public.trade_events
  where ticket is not null
    and exit_time >= now() - interval '30 days'
),
agg_trades as (
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
  group by account_number
),
total_closed AS (
  select account_number, sum(result) as total_closed
  from trades
  group by account_number
),
path as (
  select
    t.account_number,
    t.exit_time,
    sum(t.result) over (partition by t.account_number order by t.exit_time rows between unbounded preceding and current row) as cum
  from trades t
),
dd_calc as (
  select
    p.account_number,
    ((s.balance - coalesce(tc.total_closed,0)) + p.cum) as equity_t,
    max((s.balance - coalesce(tc.total_closed,0)) + p.cum) over (partition by p.account_number order by p.exit_time rows between unbounded preceding and current row) as run_peak
  from path p
  join latest_snap s on s.account_number = p.account_number
  left join total_closed tc on tc.account_number = p.account_number
),
dd_max as (
  select account_number,
         max(case when run_peak > 0 then (run_peak - equity_t) / run_peak * 100 else 0 end) as max_drawdown
  from dd_calc
  group by account_number
)
select
  s.account_number,
  s.balance,
  s.equity,
  coalesce(t.total_orders, 0) as total_orders,
  coalesce(t.gross_profit, 0) as gross_profit,
  abs(coalesce(t.gross_loss, 0)) as gross_loss,
  case when abs(coalesce(t.gross_loss, 0)) > 0
       then coalesce(t.gross_profit, 0) / abs(coalesce(t.gross_loss, 0))
       else 0 end as profit_factor,
  case when coalesce(t.total_orders, 0) > 0
       then 100.0 * coalesce(t.wins, 0) / coalesce(t.total_orders, 0)
       else 0 end as win_rate,
  coalesce(t.average_win, 0) as average_win,
  coalesce(t.average_loss, 0) as average_loss,
  coalesce(d.max_drawdown, 0) as max_drawdown
from latest_snap s
left join agg_trades t using (account_number)
left join dd_max d using (account_number);









