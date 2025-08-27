-- Fix account deletion issue by preventing automatic recreation
-- This migration addresses the problem where deleted accounts keep showing back up

-- 1. Add a "deleted" flag to mt_accounts to track soft deletes
ALTER TABLE public.mt_accounts 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Create an index for efficient deletion checks
CREATE INDEX IF NOT EXISTS mt_accounts_deleted_at_idx 
ON public.mt_accounts(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- 3. Update the map_user_from_mt_accounts function to exclude deleted accounts
CREATE OR REPLACE FUNCTION public.map_user_from_mt_accounts()
RETURNS trigger 
LANGUAGE plpgsql 
AS $$
BEGIN
  IF new.user_id IS NULL THEN
    SELECT m.user_id INTO new.user_id
    FROM public.mt_accounts m
    WHERE m.login::text = new.account_number::text
      AND m.deleted_at IS NULL  -- Only map to non-deleted accounts
    LIMIT 1;
  END IF;
  RETURN new;
END $$;

-- 4. Create a function to properly delete accounts and all related data
CREATE OR REPLACE FUNCTION public.delete_mt_account_complete(account_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_login text;
  account_user_id uuid;
BEGIN
  -- Get account details
  SELECT login, user_id INTO account_login, account_user_id
  FROM public.mt_accounts 
  WHERE id = account_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Soft delete the account (mark as deleted)
  UPDATE public.mt_accounts 
  SET deleted_at = NOW() 
  WHERE id = account_id;
  
  -- Delete all related data for this account
  DELETE FROM public.account_snapshots WHERE account_number = account_login;
  DELETE FROM public.trade_events WHERE account_number = account_login;
  DELETE FROM public.account_metrics WHERE account_number = account_login;
  
  -- Remove from license key account_numbers array
  UPDATE public.license_keys 
  SET account_numbers = array_remove(account_numbers, account_login)
  WHERE user_id = account_user_id 
    AND account_login = ANY(account_numbers);
  
  RETURN true;
END $$;

-- 5. Create a policy to prevent re-adding deleted accounts
CREATE OR REPLACE FUNCTION public.prevent_deleted_account_recreation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if this account was previously deleted
  IF EXISTS (
    SELECT 1 FROM public.mt_accounts 
    WHERE login = NEW.login 
      AND user_id = NEW.user_id 
      AND deleted_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Account % was previously deleted and cannot be recreated', NEW.login;
  END IF;
  
  RETURN NEW;
END $$;

-- 6. Add trigger to prevent recreation of deleted accounts
DROP TRIGGER IF EXISTS prevent_deleted_account_recreation_trigger ON public.mt_accounts;
CREATE TRIGGER prevent_deleted_account_recreation_trigger
  BEFORE INSERT ON public.mt_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_deleted_account_recreation();

-- 7. Update RLS policies to exclude deleted accounts
DROP POLICY IF EXISTS mt_accounts_select_own ON public.mt_accounts;
CREATE POLICY mt_accounts_select_own
  ON public.mt_accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND deleted_at IS NULL  -- Only show non-deleted accounts
  );

-- 8. Create a view for active accounts only
CREATE OR REPLACE VIEW public.active_mt_accounts AS
SELECT * FROM public.mt_accounts 
WHERE deleted_at IS NULL;

-- 9. Grant permissions on the view
GRANT SELECT ON public.active_mt_accounts TO authenticated;

-- 10. Create a function to clean up orphaned account data
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_account_data()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Delete account_metrics for accounts that don't exist in mt_accounts
  DELETE FROM public.account_metrics 
  WHERE account_number NOT IN (
    SELECT login FROM public.mt_accounts WHERE deleted_at IS NULL
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Delete account_snapshots for accounts that don't exist
  DELETE FROM public.account_snapshots 
  WHERE account_number NOT IN (
    SELECT login FROM public.mt_accounts WHERE deleted_at IS NULL
  );
  
  -- Delete trade_events for accounts that don't exist
  DELETE FROM public.trade_events 
  WHERE account_number NOT IN (
    SELECT login FROM public.mt_accounts WHERE deleted_at IS NULL
  );
  
  RETURN deleted_count;
END $$;

-- 11. Add a comment explaining the deletion process
COMMENT ON FUNCTION public.delete_mt_account_complete IS 
'Completely deletes an MT account and all related data. This function should be used instead of direct DELETE operations to ensure proper cleanup.';

COMMENT ON FUNCTION public.cleanup_orphaned_account_data IS 
'Cleans up orphaned account data for accounts that no longer exist in mt_accounts table.';
