-- Improve the delete_mt_account_complete function with better error handling and robustness

CREATE OR REPLACE FUNCTION public.delete_mt_account_complete(account_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_login text;
  account_user_id uuid;
  affected_rows integer;
BEGIN
  -- Get account details
  SELECT login, user_id INTO account_login, account_user_id
  FROM public.mt_accounts 
  WHERE id = account_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'Account % not found or already deleted', account_id;
    RETURN false;
  END IF;
  
  -- Soft delete the account (mark as deleted)
  UPDATE public.mt_accounts 
  SET deleted_at = NOW() 
  WHERE id = account_id;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN
    RAISE NOTICE 'Failed to soft delete account %', account_id;
    RETURN false;
  END IF;
  
  -- Delete all related data for this account
  DELETE FROM public.account_snapshots WHERE account_number = account_login;
  DELETE FROM public.trade_events WHERE account_number = account_login;
  DELETE FROM public.account_metrics WHERE account_number = account_login;
  
  -- Remove from license key account_numbers array (only if it exists)
  IF account_user_id IS NOT NULL THEN
    UPDATE public.license_keys 
    SET account_numbers = array_remove(account_numbers, account_login)
    WHERE user_id = account_user_id 
      AND account_numbers IS NOT NULL
      AND account_login = ANY(account_numbers);
  END IF;
  
  RAISE NOTICE 'Successfully deleted account % (login: %)', account_id, account_login;
  RETURN true;
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error deleting account %: %', account_id, SQLERRM;
    RETURN false;
END $$;
