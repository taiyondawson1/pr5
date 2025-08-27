drop view if exists public.account_daily_results_view cascade;

create view public.account_daily_results_view as
with days as (
  select distinct account_number, date(exit_time) as day
  from public.trade_events
  where ticket is not null
),
start_eq as (
  select d.account_number, d.day,
    coalesce(
      (
        select s.equity from public.account_snapshots s
        where s.account_number = d.account_number
          and s.created_at >= d.day::timestamp
          and s.created_at <  d.day::timestamp + interval '1 day'
        order by s.created_at asc
        limit 1
      ),
      (
        select s.equity from public.account_snapshots s
        where s.account_number = d.account_number
          and s.created_at < d.day::timestamp
        order by s.created_at desc
        limit 1
      )
    ) as start_equity
  from days d
),
day_trades as (
  select account_number, date(exit_time) as day, exit_time, result
  from public.trade_events
  where ticket is not null
),
agg as (
  select
    s.account_number,
    s.day,
    coalesce(s.start_equity, 0) as start_equity,
    coalesce(sum(dt.result),0) as result_usd
  from start_eq s
  left join day_trades dt on dt.account_number = s.account_number and dt.day = s.day
  group by s.account_number, s.day, s.start_equity
),
path as (
  select
    dt.account_number,
    dt.day,
    dt.exit_time,
    sum(dt.result) over (partition by dt.account_number, dt.day order by dt.exit_time rows between unbounded preceding and current row) as cum
  from day_trades dt
),
equity_path as (
  select
    p.account_number,
    p.day,
    (select a.start_equity from agg a where a.account_number=p.account_number and a.day=p.day) + p.cum as equity_t,
    p.exit_time
  from path p
),
intraday as (
  select
    e.account_number,
    e.day,
    e.equity_t,
    max(e.equity_t) over (partition by e.account_number, e.day order by e.exit_time rows between unbounded preceding and current row) as peak
  from equity_path e
),
dd as (
  select
    i.account_number,
    i.day,
    max(case when i.peak > 0 then (i.peak - i.equity_t) / i.peak * 100 else 0 end) as drawdown_pct
  from intraday i
  group by i.account_number, i.day
)
select
  a.account_number,
  a.day,
  coalesce(d.drawdown_pct,0) as drawdown_pct,
  a.result_usd,
  case when a.start_equity > 0 then a.result_usd / a.start_equity * 100 else 0 end as result_pct
from agg a
left join dd d using (account_number, day)
order by account_number, day desc;








