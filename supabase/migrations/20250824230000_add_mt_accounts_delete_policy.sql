-- Add missing DELETE and UPDATE policies for mt_accounts table
-- This allows users to delete and update their own accounts

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mt_accounts' and policyname='mt_accounts_delete_own'
  ) then
    create policy "mt_accounts_delete_own"
      on public.mt_accounts for delete
      to authenticated
      using (user_id = auth.uid());
  end if;
  
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='mt_accounts' and policyname='mt_accounts_update_own'
  ) then
    create policy "mt_accounts_update_own"
      on public.mt_accounts for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

-- Add DELETE policies for related tables to allow users to delete their account data
do $$ begin
  -- account_snapshots delete policy
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='account_snapshots' and policyname='account_snapshots_delete_own'
  ) then
    create policy "account_snapshots_delete_own"
      on public.account_snapshots for delete
      to authenticated
      using (
        account_number in (
          select login from public.mt_accounts where user_id = auth.uid()
        )
      );
  end if;
  
  -- trade_events delete policy
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='trade_events' and policyname='trade_events_delete_own'
  ) then
    create policy "trade_events_delete_own"
      on public.trade_events for delete
      to authenticated
      using (
        account_number in (
          select login from public.mt_accounts where user_id = auth.uid()
        )
      );
  end if;
  
  -- account_metrics delete policy
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='account_metrics' and policyname='account_metrics_delete_own'
  ) then
    create policy "account_metrics_delete_own"
      on public.account_metrics for delete
      to authenticated
      using (
        account_number in (
          select login from public.mt_accounts where user_id = auth.uid()
        )
      );
  end if;
end $$;
