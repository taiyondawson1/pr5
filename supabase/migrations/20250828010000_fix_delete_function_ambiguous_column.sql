-- Fix ambiguous column reference in delete_mt_account_complete function
-- The user_id column was ambiguous between mt_accounts and license_keys tables

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
