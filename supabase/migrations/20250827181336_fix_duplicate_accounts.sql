-- Fix duplicate accounts issue
-- First, clean up duplicate accounts by keeping only the most recent one for each login
DELETE FROM public.mt_accounts 
WHERE id NOT IN (
  SELECT DISTINCT ON (login, user_id) id 
  FROM public.mt_accounts 
  ORDER BY login, user_id, created_at DESC
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.mt_accounts 
ADD CONSTRAINT mt_accounts_login_user_unique 
UNIQUE (login, user_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS mt_accounts_login_user_idx 
ON public.mt_accounts (login, user_id);
