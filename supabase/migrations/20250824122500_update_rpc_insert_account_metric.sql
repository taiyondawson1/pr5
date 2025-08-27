-- Replace RPC to accept computed metrics as parameters
create or replace function public.insert_account_metric(
  p_account_number text,
  p_balance numeric,
  p_equity numeric,
  p_floating numeric,
  p_free_margin numeric,
  p_open_positions integer,
  p_average_loss numeric,
  p_average_win numeric,
  p_profit_factor numeric,
  p_max_drawdown numeric,
  p_total_orders integer,
  p_win_rate numeric
) returns void
language sql
security definer
set search_path = public as $$
  insert into public.account_metrics(
    account_number, balance, equity, floating, free_margin, open_positions,
    average_loss, average_win, profit_factor, max_drawdown, total_orders, win_rate
  ) values (
    p_account_number, p_balance, p_equity, p_floating, p_free_margin, p_open_positions,
    p_average_loss, p_average_win, p_profit_factor, p_max_drawdown, p_total_orders, p_win_rate
  );
$$;

revoke all on function public.insert_account_metric(text, numeric, numeric, numeric, numeric, integer, numeric, numeric, numeric, numeric, integer, numeric) from public;
grant execute on function public.insert_account_metric(text, numeric, numeric, numeric, numeric, integer, numeric, numeric, numeric, numeric, integer, numeric) to anon, authenticated;









