-- Ensure account_metrics has all KPI columns
alter table public.account_metrics
  add column if not exists account_number text,
  add column if not exists balance numeric,
  add column if not exists equity numeric,
  add column if not exists floating numeric,
  add column if not exists free_margin numeric,
  add column if not exists open_positions integer,
  add column if not exists average_loss numeric,
  add column if not exists average_win numeric,
  add column if not exists profit_factor numeric,
  add column if not exists max_drawdown numeric,
  add column if not exists total_orders integer,
  add column if not exists win_rate numeric,
  add column if not exists total_result numeric,
  add column if not exists withdrawals numeric,
  add column if not exists last_trade_time timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create index if not exists account_metrics_account_number_created_at_idx
  on public.account_metrics(account_number, created_at desc);








