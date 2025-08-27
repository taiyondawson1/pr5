-- Drop any foreign keys on account_metrics.account_number that point to old tables
alter table public.account_metrics drop constraint if exists account_metrics_account_number_fkey;
alter table public.account_metrics drop constraint if exists account_metrics_account_fk;

-- Optionally, you can re-add an FK to mt_accounts(login). Uncomment if desired.
-- alter table public.account_metrics
--   add constraint account_metrics_account_fk
--   foreign key (account_number)
--   references public.mt_accounts(login)
--   on delete cascade;









