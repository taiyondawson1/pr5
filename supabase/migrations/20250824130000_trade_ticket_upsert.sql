-- Add ticket and upsert capability for trades
alter table public.trade_events add column if not exists ticket bigint;
create unique index if not exists trade_events_account_ticket_uidx on public.trade_events(account_number, ticket);

drop function if exists public.insert_trade(text,text,text,numeric,timestamptz,timestamptz,numeric,numeric,numeric,numeric,numeric);

create or replace function public.insert_trade(
  p_account_number text,
  p_ticket bigint,
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
    account_number, ticket, symbol, type, size, entry_time, exit_time, entry_price, exit_price, commission, swap, result
  ) values (
    p_account_number, p_ticket, p_symbol, p_type, p_size, p_entry_time, p_exit_time, p_entry_price, p_exit_price, p_commission, p_swap, p_result
  )
  on conflict (account_number, ticket) do update set
    symbol = excluded.symbol,
    type = excluded.type,
    size = excluded.size,
    entry_time = excluded.entry_time,
    exit_time = excluded.exit_time,
    entry_price = excluded.entry_price,
    exit_price = excluded.exit_price,
    commission = excluded.commission,
    swap = excluded.swap,
    result = excluded.result;
$$;

revoke all on function public.insert_trade(text,bigint,text,text,numeric,timestamptz,timestamptz,numeric,numeric,numeric,numeric,numeric) from public;
grant execute on function public.insert_trade(text,bigint,text,text,numeric,timestamptz,timestamptz,numeric,numeric,numeric,numeric,numeric) to anon, authenticated;









