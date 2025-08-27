-- Reset RLS policies for account_metrics
alter table public.account_metrics enable row level security;

-- Drop known policies if they exist
drop policy if exists am_ins_anon on public.account_metrics;
drop policy if exists am_sel_auth on public.account_metrics;
drop policy if exists account_metrics_insert_any on public.account_metrics;
drop policy if exists account_metrics_insert_anon on public.account_metrics;
drop policy if exists account_metrics_select_own on public.account_metrics;
drop policy if exists account_metrics_select_all_auth on public.account_metrics;

-- Allow inserts from anon (EA via REST)
create policy am_ins_anon
on public.account_metrics
for insert
to anon
with check (true);

-- Allow selects to authenticated users
create policy am_sel_auth
on public.account_metrics
for select
to authenticated
using (true);








