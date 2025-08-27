-- Snapshot insert RPC with SECURITY DEFINER
create or replace function public.insert_snapshot(
  p_account_number text,
  p_balance numeric,
  p_equity numeric,
  p_floating numeric,
  p_free_margin numeric,
  p_open_positions integer
) returns void
language sql
security definer
set search_path = public as $$
  insert into public.account_snapshots(
    account_number, balance, equity, floating, free_margin, open_positions
  ) values (
    p_account_number, p_balance, p_equity, p_floating, p_free_margin, p_open_positions
  );
$$;

revoke all on function public.insert_snapshot(text,numeric,numeric,numeric,numeric,integer) from public;
grant execute on function public.insert_snapshot(text,numeric,numeric,numeric,numeric,integer) to anon, authenticated;








